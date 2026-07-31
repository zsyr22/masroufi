-- =========================================================
-- Masroufi
-- Migration: 017 - Protect source-managed transactions
-- =========================================================

-- Repair any drift that was created before this protection existed.
update public.transactions t
set
  amount = p.total,
  account_id = p.account_id,
  category_id = p.category_id,
  currency = p.currency,
  transaction_date = p.purchase_date,
  updated_at = now()
from public.purchases p
where p.transaction_id = t.id
  and (
    t.amount is distinct from p.total
    or t.account_id is distinct from p.account_id
    or t.category_id is distinct from p.category_id
    or t.currency is distinct from p.currency
    or t.transaction_date is distinct from p.purchase_date
  );

update public.transactions t
set
  amount = bp.amount,
  category_id = b.category_id,
  currency = b.currency,
  transaction_date = bp.paid_at,
  updated_at = now()
from public.bill_payments bp
join public.bills b on b.id = bp.bill_id
where bp.transaction_id = t.id
  and (
    t.amount is distinct from bp.amount
    or t.category_id is distinct from b.category_id
    or t.currency is distinct from b.currency
    or t.transaction_date is distinct from bp.paid_at
  );

create or replace function public.prevent_linked_transaction_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.purchases p
    where p.transaction_id = old.id
  ) or exists (
    select 1
    from public.bill_payments bp
    where bp.transaction_id = old.id
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

DROP TRIGGER IF EXISTS transactions_protect_linked_update
ON public.transactions;

CREATE TRIGGER transactions_protect_linked_update
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_linked_transaction_update();
