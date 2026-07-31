-- =========================================================
-- Masroufi
-- Migration: 019 - Bill month follows payment date
-- Purpose:
--   Prevent a bill payment from being assigned to a hidden/current month
--   that differs from the selected payment date.
-- =========================================================

create or replace function public.pay_bill(
  p_bill_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_paid_at date,
  p_billing_month date,
  p_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bill public.bills%rowtype;
  v_account public.accounts%rowtype;
  v_payee_id uuid;
  v_transaction_id uuid;
  v_payment_id uuid;
  v_billing_month date := date_trunc('month', p_paid_at)::date;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_paid_at is null then
    raise exception 'Payment date is required';
  end if;

  select *
  into v_bill
  from public.bills
  where id = p_bill_id
    and user_id = v_user_id
    and is_active = true;

  if not found then
    raise exception 'Invalid bill';
  end if;

  select *
  into v_account
  from public.accounts
  where id = p_account_id
    and user_id = v_user_id
    and is_active = true;

  if not found then
    raise exception 'Invalid account';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  select id
  into v_payee_id
  from public.payees
  where user_id = v_user_id
    and lower(name) = lower(coalesce(v_bill.provider, v_bill.name))
    and is_active = true
  limit 1;

  if v_payee_id is null then
    insert into public.payees (user_id, name, type)
    values (v_user_id, coalesce(v_bill.provider, v_bill.name), 'company')
    returning id into v_payee_id;
  end if;

  insert into public.transactions (
    user_id,
    account_id,
    category_id,
    payee_id,
    type,
    amount,
    currency,
    transaction_date,
    notes
  )
  values (
    v_user_id,
    p_account_id,
    v_bill.category_id,
    v_payee_id,
    'expense'::public.transaction_type,
    p_amount,
    v_account.currency,
    p_paid_at,
    coalesce(nullif(trim(p_notes), ''), v_bill.name || ' bill')
  )
  returning id into v_transaction_id;

  insert into public.bill_payments (
    user_id,
    bill_id,
    transaction_id,
    billing_month,
    amount,
    paid_at,
    notes
  )
  values (
    v_user_id,
    p_bill_id,
    v_transaction_id,
    v_billing_month,
    p_amount,
    p_paid_at,
    nullif(trim(p_notes), '')
  )
  returning id into v_payment_id;

  return v_payment_id;
end;
$$;

-- The billing month argument remains temporarily for backward compatibility,
-- but the database deliberately derives the real month from p_paid_at.
revoke all on function public.pay_bill(uuid, uuid, numeric, date, date, text) from public;
grant execute on function public.pay_bill(uuid, uuid, numeric, date, date, text) to authenticated;
