-- =========================================================
-- Masroufi
-- Migration: 015 - Online purchase delivery fees
-- Run after 012, 013 and 014.
-- =========================================================

alter table public.purchases
  add column if not exists delivery_fee numeric(14,2) not null default 0
  check (delivery_fee >= 0);

alter table public.purchases drop constraint if exists purchases_total_matches;
alter table public.purchases
  add constraint purchases_total_matches
  check (abs((subtotal + tax + delivery_fee - discount) - total) <= 0.02);

drop function if exists public.create_purchase(
  uuid, public.purchase_channel, text, uuid, uuid, date,
  numeric, numeric, numeric, text, jsonb
);

create or replace function public.create_purchase(
  p_store_id uuid,
  p_channel public.purchase_channel,
  p_branch_name text,
  p_account_id uuid,
  p_category_id uuid,
  p_purchase_date date,
  p_tax numeric,
  p_discount numeric,
  p_delivery_fee numeric,
  p_total numeric,
  p_notes text,
  p_items jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_account public.accounts%rowtype;
  v_category public.categories%rowtype;
  v_store public.stores%rowtype;
  v_payee_id uuid;
  v_transaction_id uuid;
  v_purchase_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_subtotal numeric(14,2) := 0;
  v_qty numeric(12,3);
  v_unit_price numeric(14,4);
  v_line_total numeric(14,2);
  v_delivery_fee numeric(14,2) := 0;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'At least one item is required'; end if;

  select * into v_store from public.stores where id = p_store_id and user_id = v_user_id and is_active = true;
  if not found then raise exception 'Invalid store'; end if;
  select * into v_account from public.accounts where id = p_account_id and user_id = v_user_id and is_active = true;
  if not found then raise exception 'Invalid account'; end if;
  select * into v_category from public.categories where id = p_category_id and user_id = v_user_id and is_active = true and transaction_type = 'expense';
  if not found then raise exception 'Invalid expense category'; end if;

  v_delivery_fee := case when p_channel = 'online' then coalesce(p_delivery_fee, 0) else 0 end;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_line_total := round(v_qty * v_unit_price, 2);
    if trim(coalesce(v_item->>'name', '')) = '' or v_qty <= 0 or v_unit_price < 0 then raise exception 'Invalid purchase item'; end if;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if abs((v_subtotal + coalesce(p_tax,0) + v_delivery_fee - coalesce(p_discount,0)) - p_total) > 0.02 then
    raise exception 'Receipt total does not match item totals, tax, delivery and discount';
  end if;

  select id into v_payee_id from public.payees where user_id = v_user_id and lower(name) = lower(v_store.name) and is_active = true limit 1;
  if v_payee_id is null then
    insert into public.payees(user_id, name, type) values (v_user_id, v_store.name, 'store') returning id into v_payee_id;
  end if;

  insert into public.transactions(user_id, account_id, category_id, payee_id, type, amount, currency, transaction_date, notes)
  values (v_user_id, p_account_id, p_category_id, v_payee_id, 'expense', p_total, v_account.currency, p_purchase_date,
    coalesce(nullif(trim(p_notes),''), 'Itemized purchase · ' || v_store.name)) returning id into v_transaction_id;

  insert into public.purchases(
    user_id, transaction_id, store_id, account_id, category_id, purchase_date, currency,
    subtotal, tax, discount, delivery_fee, total, notes, channel, branch_name
  ) values (
    v_user_id, v_transaction_id, p_store_id, p_account_id, p_category_id, p_purchase_date, v_account.currency,
    v_subtotal, coalesce(p_tax,0), coalesce(p_discount,0), v_delivery_fee, p_total,
    nullif(trim(p_notes),''), p_channel,
    case when p_channel='physical' then nullif(trim(p_branch_name),'') else null end
  ) returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_line_total := round(v_qty * v_unit_price, 2);
    select id into v_product_id from public.products
      where user_id = v_user_id and lower(name) = lower(trim(v_item->>'name')) and is_active = true limit 1;
    if v_product_id is null then
      insert into public.products(user_id, name, default_category_id, default_unit)
      values (
        v_user_id,
        trim(v_item->>'name'),
        nullif(v_item->>'categoryId','')::uuid,
        coalesce(nullif(v_item->>'unit','')::public.purchase_unit, 'piece')
      ) returning id into v_product_id;
    end if;
    insert into public.purchase_items(purchase_id, product_id, category_id, name, quantity, unit, unit_price, line_total)
    values (
      v_purchase_id, v_product_id, nullif(v_item->>'categoryId','')::uuid,
      trim(v_item->>'name'), v_qty,
      coalesce(nullif(v_item->>'unit','')::public.purchase_unit, 'piece'),
      v_unit_price, v_line_total
    );
  end loop;

  return v_purchase_id;
end;
$$;

grant execute on function public.create_purchase(
  uuid, public.purchase_channel, text, uuid, uuid, date,
  numeric, numeric, numeric, numeric, text, jsonb
) to authenticated;
