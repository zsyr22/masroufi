-- =========================================================
-- Masroufi
-- Migration: 020 - Edit and delete recorded bill payments
-- =========================================================

create or replace function public.prevent_linked_transaction_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_setting('app.masroufi_source_sync', true) = 'on' then
    return new;
  end if;

  if exists (
    select 1 from public.purchases p where p.transaction_id = old.id
  ) or exists (
    select 1 from public.bill_payments bp where bp.transaction_id = old.id
  ) then
    if new.amount is distinct from old.amount
      or new.account_id is distinct from old.account_id
      or new.category_id is distinct from old.category_id
      or new.payee_id is distinct from old.payee_id
      or new.type is distinct from old.type
      or new.currency is distinct from old.currency
      or new.transaction_date is distinct from old.transaction_date
      or new.notes is distinct from old.notes
    then
      raise exception using
        errcode = 'P0001',
        message = 'This transaction is managed by its original purchase or bill payment.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_linked_transaction_update() from public;

create or replace function public.update_bill_payment(
  p_payment_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_paid_at date,
  p_notes text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_payment public.bill_payments%rowtype;
  v_bill public.bills%rowtype;
  v_account public.accounts%rowtype;
  v_normalized_month date := date_trunc('month', p_paid_at)::date;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  select * into v_payment
  from public.bill_payments
  where id = p_payment_id and user_id = v_user_id;

  if not found then
    raise exception 'Invalid bill payment';
  end if;

  select * into v_bill
  from public.bills
  where id = v_payment.bill_id and user_id = v_user_id;

  if not found then
    raise exception 'Invalid bill';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id and user_id = v_user_id and is_active = true;

  if not found then
    raise exception 'Invalid account';
  end if;

  if exists (
    select 1
    from public.bill_payments other
    where other.bill_id = v_payment.bill_id
      and other.billing_month = v_normalized_month
      and other.id <> v_payment.id
  ) then
    raise exception using errcode = '23505', message = 'This bill is already paid for that month.';
  end if;

  perform set_config('app.masroufi_source_sync', 'on', true);

  update public.bill_payments
  set
    billing_month = v_normalized_month,
    amount = p_amount,
    paid_at = p_paid_at,
    notes = nullif(trim(p_notes), '')
  where id = v_payment.id and user_id = v_user_id;

  update public.transactions
  set
    account_id = p_account_id,
    category_id = v_bill.category_id,
    type = 'expense'::public.transaction_type,
    amount = p_amount,
    currency = v_account.currency,
    transaction_date = p_paid_at,
    notes = coalesce(nullif(trim(p_notes), ''), v_bill.name || ' bill'),
    updated_at = now()
  where id = v_payment.transaction_id and user_id = v_user_id;
end;
$$;

create or replace function public.delete_bill_payment(p_payment_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select transaction_id into v_transaction_id
  from public.bill_payments
  where id = p_payment_id and user_id = v_user_id;

  if not found then
    raise exception 'Invalid bill payment';
  end if;

  -- Deleting the transaction also deletes its bill_payment through the FK cascade.
  delete from public.transactions
  where id = v_transaction_id and user_id = v_user_id;
end;
$$;

revoke all on function public.update_bill_payment(uuid, uuid, numeric, date, text) from public;
revoke all on function public.delete_bill_payment(uuid) from public;
grant execute on function public.update_bill_payment(uuid, uuid, numeric, date, text) to authenticated;
grant execute on function public.delete_bill_payment(uuid) to authenticated;
