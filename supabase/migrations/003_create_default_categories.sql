-- =========================================================
-- Masroufi
-- Migration: 003 - Default categories
-- Purpose:
--   Create a secure function that inserts starter categories
--   for the currently authenticated user.
-- =========================================================

create or replace function public.create_default_categories()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.categories (
    user_id,
    name,
    transaction_type,
    is_system
  )
  values
    (current_user_id, 'Salary', 'income', true),
    (current_user_id, 'Other income', 'income', true),

    (current_user_id, 'Groceries', 'expense', true),
    (current_user_id, 'Restaurants', 'expense', true),
    (current_user_id, 'Fuel', 'expense', true),
    (current_user_id, 'Car', 'expense', true),
    (current_user_id, 'Rent', 'expense', true),
    (current_user_id, 'Electricity', 'expense', true),
    (current_user_id, 'Water', 'expense', true),
    (current_user_id, 'Internet', 'expense', true),
    (current_user_id, 'Mobile', 'expense', true),
    (current_user_id, 'Home', 'expense', true),
    (current_user_id, 'Entertainment', 'expense', true),
    (current_user_id, 'Clothing', 'expense', true),
    (current_user_id, 'Health', 'expense', true),
    (current_user_id, 'Subscriptions', 'expense', true),
    (current_user_id, 'Transfers to wife', 'expense', true),
    (current_user_id, 'Other expense', 'expense', true)
  on conflict do nothing;
end;
$$;

grant execute
on function public.create_default_categories()
to authenticated;