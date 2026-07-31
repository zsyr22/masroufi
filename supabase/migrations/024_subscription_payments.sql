-- =========================================================
-- Masroufi
-- Migration: 024 - Source-managed subscription payments
-- =========================================================

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  paid_at date not null,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscription_payments_user_id_idx on public.subscription_payments(user_id);
create index if not exists subscription_payments_subscription_id_idx on public.subscription_payments(subscription_id);
create index if not exists subscription_payments_paid_at_idx on public.subscription_payments(user_id, paid_at desc);

alter table public.subscription_payments enable row level security;

drop policy if exists "Users can view their own subscription payments" on public.subscription_payments;
create policy "Users can view their own subscription payments"
on public.subscription_payments for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own subscription payments" on public.subscription_payments;
create policy "Users can create their own subscription payments"
on public.subscription_payments for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own subscription payments" on public.subscription_payments;
create policy "Users can update their own subscription payments"
on public.subscription_payments for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own subscription payments" on public.subscription_payments;
create policy "Users can delete their own subscription payments"
on public.subscription_payments for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.subscription_payments to authenticated;

create or replace function public.set_subscription_payment_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_subscription_payments_updated_at on public.subscription_payments;
create trigger set_subscription_payments_updated_at
before update on public.subscription_payments
for each row execute function public.set_subscription_payment_updated_at();

-- Preserve existing history. Every existing subscription-linked transaction
-- becomes a source payment record.
insert into public.subscription_payments (
  user_id, subscription_id, transaction_id, amount, paid_at, notes, created_at, updated_at
)
select
  t.user_id, t.subscription_id, t.id, t.amount, t.transaction_date, t.notes, t.created_at, t.updated_at
from public.transactions t
where t.subscription_id is not null
on conflict (transaction_id) do nothing;

create or replace function public.next_subscription_date(p_date date, p_cycle public.subscription_billing_cycle)
returns date language sql immutable as $$
  select case p_cycle::text
    when 'one_time' then null
    when 'weekly' then (p_date + interval '7 days')::date
    when 'monthly' then (p_date + interval '1 month')::date
    when 'quarterly' then (p_date + interval '3 months')::date
    when 'yearly' then (p_date + interval '1 year')::date
    else null
  end;
$$;

create or replace function public.refresh_subscription_payment_state(p_subscription_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_subscription public.subscriptions%rowtype;
  v_count integer;
  v_last_paid date;
  v_next date;
  v_status public.subscription_status;
begin
  select * into v_subscription
  from public.subscriptions
  where id = p_subscription_id and user_id = v_user_id;

  if not found then raise exception 'Invalid subscription'; end if;

  select count(*)::integer, max(paid_at)
  into v_count, v_last_paid
  from public.subscription_payments
  where subscription_id = p_subscription_id and user_id = v_user_id;

  if v_count = 0 then
    v_next := v_subscription.start_date;
    v_status := case when v_subscription.status::text = 'cancelled' then v_subscription.status else 'active'::public.subscription_status end;
  else
    v_next := public.next_subscription_date(v_last_paid, v_subscription.billing_cycle);
    v_status := 'active'::public.subscription_status;

    if v_subscription.billing_cycle::text = 'one_time' then
      v_next := null;
      v_status := 'completed'::public.subscription_status;
    elsif v_subscription.duration_type::text = 'payment_count'
      and v_subscription.total_payments is not null
      and v_count >= v_subscription.total_payments then
      v_next := null;
      v_status := 'completed'::public.subscription_status;
    elsif v_subscription.duration_type::text = 'fixed_period'
      and v_subscription.end_date is not null
      and v_next is not null
      and v_next > v_subscription.end_date
      and not v_subscription.auto_renew then
      v_next := null;
      v_status := 'completed'::public.subscription_status;
    end if;
  end if;

  update public.subscriptions
  set payments_made = v_count,
      last_paid_at = v_last_paid,
      next_payment_date = v_next,
      status = v_status
  where id = p_subscription_id and user_id = v_user_id;
end;
$$;

create or replace function public.record_subscription_payment(
  p_subscription_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_paid_at date,
  p_notes text
)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_subscription public.subscriptions%rowtype;
  v_account public.accounts%rowtype;
  v_transaction_id uuid;
  v_payment_id uuid;
  v_notes text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount <= 0 then raise exception 'Amount must be greater than zero'; end if;

  select * into v_subscription from public.subscriptions
  where id = p_subscription_id and user_id = v_user_id;
  if not found then raise exception 'Invalid subscription'; end if;
  if v_subscription.status::text <> 'active' then raise exception 'Only active subscriptions can be paid'; end if;
  if v_subscription.category_id is null then raise exception 'Select a category before recording this payment'; end if;

  select * into v_account from public.accounts
  where id = p_account_id and user_id = v_user_id and is_active = true;
  if not found then raise exception 'Invalid account'; end if;

  v_notes := coalesce(nullif(trim(p_notes), ''),
    'Subscription payment: ' || v_subscription.name ||
    case when v_subscription.provider is not null then ' · Provider: ' || v_subscription.provider else '' end);

  insert into public.transactions (
    user_id, account_id, category_id, payee_id, subscription_id,
    type, amount, currency, transaction_date, notes
  ) values (
    v_user_id, p_account_id, v_subscription.category_id, null, v_subscription.id,
    'expense'::public.transaction_type, p_amount, v_account.currency, p_paid_at, v_notes
  ) returning id into v_transaction_id;

  insert into public.subscription_payments (
    user_id, subscription_id, transaction_id, amount, paid_at, notes
  ) values (
    v_user_id, v_subscription.id, v_transaction_id, p_amount, p_paid_at, nullif(trim(p_notes), '')
  ) returning id into v_payment_id;

  perform public.refresh_subscription_payment_state(v_subscription.id);
  return v_payment_id;
end;
$$;

create or replace function public.update_subscription_payment(
  p_payment_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_paid_at date,
  p_notes text
)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_payment public.subscription_payments%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_account public.accounts%rowtype;
  v_notes text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount <= 0 then raise exception 'Amount must be greater than zero'; end if;

  select * into v_payment from public.subscription_payments
  where id = p_payment_id and user_id = v_user_id;
  if not found then raise exception 'Invalid subscription payment'; end if;

  select * into v_subscription from public.subscriptions
  where id = v_payment.subscription_id and user_id = v_user_id;
  if not found then raise exception 'Invalid subscription'; end if;

  select * into v_account from public.accounts
  where id = p_account_id and user_id = v_user_id and is_active = true;
  if not found then raise exception 'Invalid account'; end if;

  v_notes := coalesce(nullif(trim(p_notes), ''),
    'Subscription payment: ' || v_subscription.name ||
    case when v_subscription.provider is not null then ' · Provider: ' || v_subscription.provider else '' end);

  perform set_config('app.masroufi_source_sync', 'on', true);

  update public.subscription_payments
  set amount = p_amount, paid_at = p_paid_at, notes = nullif(trim(p_notes), '')
  where id = v_payment.id and user_id = v_user_id;

  update public.transactions
  set account_id = p_account_id,
      category_id = v_subscription.category_id,
      subscription_id = v_subscription.id,
      type = 'expense'::public.transaction_type,
      amount = p_amount,
      currency = v_account.currency,
      transaction_date = p_paid_at,
      notes = v_notes,
      updated_at = now()
  where id = v_payment.transaction_id and user_id = v_user_id;

  perform public.refresh_subscription_payment_state(v_subscription.id);
end;
$$;

create or replace function public.delete_subscription_payment(p_payment_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction_id uuid;
  v_subscription_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select transaction_id, subscription_id into v_transaction_id, v_subscription_id
  from public.subscription_payments
  where id = p_payment_id and user_id = v_user_id;
  if not found then raise exception 'Invalid subscription payment'; end if;

  delete from public.transactions where id = v_transaction_id and user_id = v_user_id;
  perform public.refresh_subscription_payment_state(v_subscription_id);
end;
$$;

-- Source-linked subscription transactions cannot be edited directly.
create or replace function public.prevent_linked_transaction_update()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if current_setting('app.masroufi_source_sync', true) = 'on' then return new; end if;

  if exists (select 1 from public.purchases p where p.transaction_id = old.id)
    or exists (select 1 from public.bill_payments bp where bp.transaction_id = old.id)
    or exists (select 1 from public.subscription_payments sp where sp.transaction_id = old.id)
  then
    if new.amount is distinct from old.amount
      or new.account_id is distinct from old.account_id
      or new.category_id is distinct from old.category_id
      or new.payee_id is distinct from old.payee_id
      or new.type is distinct from old.type
      or new.currency is distinct from old.currency
      or new.transaction_date is distinct from old.transaction_date
      or new.notes is distinct from old.notes
    then
      raise exception using errcode = 'P0001', message = 'This transaction is managed by its original purchase, bill payment, or subscription payment.';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.next_subscription_date(date, public.subscription_billing_cycle) from public;
revoke all on function public.refresh_subscription_payment_state(uuid) from public;
revoke all on function public.record_subscription_payment(uuid, uuid, numeric, date, text) from public;
revoke all on function public.update_subscription_payment(uuid, uuid, numeric, date, text) from public;
revoke all on function public.delete_subscription_payment(uuid) from public;
grant execute on function public.next_subscription_date(date, public.subscription_billing_cycle) to authenticated;
grant execute on function public.refresh_subscription_payment_state(uuid) to authenticated;
grant execute on function public.record_subscription_payment(uuid, uuid, numeric, date, text) to authenticated;
grant execute on function public.update_subscription_payment(uuid, uuid, numeric, date, text) to authenticated;
grant execute on function public.delete_subscription_payment(uuid) to authenticated;
