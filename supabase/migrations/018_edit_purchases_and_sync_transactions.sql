-- =========================================================
-- Masroufi
-- Migration: 018 - Edit purchases and synchronize transactions
-- =========================================================

-- Linked transactions remain protected from direct edits. A source-owned
-- database function may temporarily enable synchronization inside its own
-- transaction only.
create or replace function public.prevent_linked_transaction_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_setting('masroufi.allow_linked_transaction_sync', true) = 'on' then
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

create or replace function public.update_purchase(
  p_purchase_id uuid,
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
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_purchase public.purchases%rowtype;
  v_account public.accounts%rowtype;
  v_category public.categories%rowtype;
  v_store public.stores%rowtype;
  v_payee_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_subtotal numeric(14,2) := 0;
  v_qty numeric(12,3);
  v_unit_price numeric(14,4);
  v_line_total numeric(14,2);
  v_delivery_fee numeric(14,2) := 0;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one item is required';
  end if;

  select * into v_purchase
  from public.purchases
  where id = p_purchase_id and user_id = v_user_id
  for update;
  if not found then raise exception 'Purchase not found'; end if;

  select * into v_store
  from public.stores
  where id = p_store_id and user_id = v_user_id and is_active = true;
  if not found then raise exception 'Invalid store'; end if;

  select * into v_account
  from public.accounts
  where id = p_account_id and user_id = v_user_id and is_active = true;
  if not found then raise exception 'Invalid account'; end if;

  select * into v_category
  from public.categories
  where id = p_category_id
    and user_id = v_user_id
    and is_active = true
    and transaction_type = 'expense';
  if not found then raise exception 'Invalid expense category'; end if;

  v_delivery_fee := case when p_channel = 'online' then coalesce(p_delivery_fee, 0) else 0 end;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_line_total := round(v_qty * v_unit_price, 2);

    if trim(coalesce(v_item->>'name', '')) = '' or v_qty <= 0 or v_unit_price < 0 then
      raise exception 'Invalid purchase item';
    end if;

    if nullif(v_item->>'categoryId', '') is not null and not exists (
      select 1 from public.categories c
      where c.id = (v_item->>'categoryId')::uuid
        and c.user_id = v_user_id
        and c.is_active = true
        and c.transaction_type = 'expense'
    ) then
      raise exception 'Invalid item category';
    end if;

    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if abs((v_subtotal + coalesce(p_tax, 0) + v_delivery_fee - coalesce(p_discount, 0)) - p_total) > 0.02 then
    raise exception 'Receipt total does not match item totals, tax, delivery and discount';
  end if;

  select id into v_payee_id
  from public.payees
  where user_id = v_user_id
    and lower(name) = lower(v_store.name)
    and is_active = true
  limit 1;

  if v_payee_id is null then
    insert into public.payees(user_id, name, type)
    values (v_user_id, v_store.name, 'store')
    returning id into v_payee_id;
  end if;

  update public.purchases
  set
    store_id = p_store_id,
    account_id = p_account_id,
    category_id = p_category_id,
    purchase_date = p_purchase_date,
    currency = v_account.currency,
    subtotal = v_subtotal,
    tax = coalesce(p_tax, 0),
    discount = coalesce(p_discount, 0),
    delivery_fee = v_delivery_fee,
    total = p_total,
    notes = nullif(trim(p_notes), ''),
    channel = p_channel,
    branch_name = case when p_channel = 'physical' then nullif(trim(p_branch_name), '') else null end
  where id = p_purchase_id and user_id = v_user_id;

  perform set_config('masroufi.allow_linked_transaction_sync', 'on', true);

  update public.transactions
  set
    account_id = p_account_id,
    category_id = p_category_id,
    payee_id = v_payee_id,
    type = 'expense',
    amount = p_total,
    currency = v_account.currency,
    transaction_date = p_purchase_date,
    notes = coalesce(nullif(trim(p_notes), ''), 'Itemized purchase · ' || v_store.name),
    updated_at = now()
  where id = v_purchase.transaction_id and user_id = v_user_id;

  delete from public.purchase_items where purchase_id = p_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_line_total := round(v_qty * v_unit_price, 2);

    select id into v_product_id
    from public.products
    where user_id = v_user_id
      and lower(name) = lower(trim(v_item->>'name'))
      and is_active = true
    limit 1;

    if v_product_id is null then
      insert into public.products(user_id, name, default_category_id, default_unit)
      values (
        v_user_id,
        trim(v_item->>'name'),
        nullif(v_item->>'categoryId', '')::uuid,
        coalesce(nullif(v_item->>'unit', '')::public.purchase_unit, 'piece')
      )
      returning id into v_product_id;
    end if;

    insert into public.purchase_items(
      purchase_id, product_id, category_id, name,
      quantity, unit, unit_price, line_total
    ) values (
      p_purchase_id,
      v_product_id,
      nullif(v_item->>'categoryId', '')::uuid,
      trim(v_item->>'name'),
      v_qty,
      coalesce(nullif(v_item->>'unit', '')::public.purchase_unit, 'piece'),
      v_unit_price,
      v_line_total
    );
  end loop;
end;
$$;

revoke all on function public.update_purchase(
  uuid, uuid, public.purchase_channel, text, uuid, uuid, date,
  numeric, numeric, numeric, numeric, text, jsonb
) from public;

grant execute on function public.update_purchase(
  uuid, uuid, public.purchase_channel, text, uuid, uuid, date,
  numeric, numeric, numeric, numeric, text, jsonb
) to authenticated;
