-- =========================================================
-- Masroufi
-- Migration: 011 - Purchases and itemized receipts
-- =========================================================

create type public.purchase_unit as enum (
  'piece',
  'kg',
  'g',
  'l',
  'ml',
  'pack',
  'box',
  'other'
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  branch text check (branch is null or char_length(branch) <= 100),
  is_favorite boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index stores_unique_active_name_branch_idx
  on public.stores(user_id, lower(name), lower(coalesce(branch, '')))
  where is_active = true;
create index stores_user_id_idx on public.stores(user_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 140),
  barcode text check (barcode is null or char_length(barcode) <= 80),
  default_category_id uuid references public.categories(id) on delete set null,
  default_unit public.purchase_unit not null default 'piece',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index products_unique_active_name_idx
  on public.products(user_id, lower(name))
  where is_active = true;
create index products_user_id_idx on public.products(user_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete restrict,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  purchase_date date not null default current_date,
  currency public.currency_code not null,
  subtotal numeric(14,2) not null check (subtotal >= 0),
  tax numeric(14,2) not null default 0 check (tax >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  total numeric(14,2) not null check (total > 0),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchases_total_matches check (abs((subtotal + tax - discount) - total) <= 0.02)
);

create index purchases_user_date_idx on public.purchases(user_id, purchase_date desc);
create index purchases_store_idx on public.purchases(store_id);
create index purchases_account_idx on public.purchases(account_id);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 140),
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit public.purchase_unit not null default 'piece',
  unit_price numeric(14,4) not null check (unit_price >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint purchase_items_total_matches check (abs((quantity * unit_price) - line_total) <= 0.02)
);

create index purchase_items_purchase_idx on public.purchase_items(purchase_id);
create index purchase_items_product_idx on public.purchase_items(product_id);

create trigger stores_set_updated_at before update on public.stores
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger purchases_set_updated_at before update on public.purchases
for each row execute function public.set_updated_at();

grant usage on type public.purchase_unit to authenticated;
grant select, insert, update, delete on public.stores, public.products, public.purchases, public.purchase_items to authenticated;

alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;

create policy stores_own_all on public.stores for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy products_own_all on public.products for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy purchases_own_all on public.purchases for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy purchase_items_select_own on public.purchase_items for select to authenticated
using (exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = (select auth.uid())));
create policy purchase_items_insert_own on public.purchase_items for insert to authenticated
with check (exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = (select auth.uid())));
create policy purchase_items_update_own on public.purchase_items for update to authenticated
using (exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = (select auth.uid())))
with check (exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = (select auth.uid())));
create policy purchase_items_delete_own on public.purchase_items for delete to authenticated
using (exists (select 1 from public.purchases p where p.id = purchase_id and p.user_id = (select auth.uid())));

create or replace function public.create_purchase(
  p_store_name text,
  p_store_branch text,
  p_account_id uuid,
  p_category_id uuid,
  p_purchase_date date,
  p_tax numeric,
  p_discount numeric,
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
  v_store_id uuid;
  v_payee_id uuid;
  v_transaction_id uuid;
  v_purchase_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_subtotal numeric(14,2) := 0;
  v_qty numeric(12,3);
  v_unit_price numeric(14,4);
  v_line_total numeric(14,2);
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if trim(coalesce(p_store_name, '')) = '' then raise exception 'Store name is required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'At least one item is required'; end if;

  select * into v_account from public.accounts
  where id = p_account_id and user_id = v_user_id and is_active = true;
  if not found then raise exception 'Invalid account'; end if;

  select * into v_category from public.categories
  where id = p_category_id and user_id = v_user_id and is_active = true and transaction_type = 'expense';
  if not found then raise exception 'Invalid expense category'; end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_line_total := round(v_qty * v_unit_price, 2);
    if trim(coalesce(v_item->>'name', '')) = '' or v_qty <= 0 or v_unit_price < 0 then
      raise exception 'Invalid purchase item';
    end if;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if abs((v_subtotal + coalesce(p_tax,0) - coalesce(p_discount,0)) - p_total) > 0.02 then
    raise exception 'Receipt total does not match item totals';
  end if;

  select id into v_store_id from public.stores
  where user_id = v_user_id and lower(name) = lower(trim(p_store_name))
    and lower(coalesce(branch,'')) = lower(coalesce(trim(p_store_branch),'')) and is_active = true;
  if v_store_id is null then
    insert into public.stores(user_id, name, branch)
    values (v_user_id, trim(p_store_name), nullif(trim(p_store_branch),'')) returning id into v_store_id;
  end if;

  select id into v_payee_id from public.payees
  where user_id = v_user_id and lower(name) = lower(trim(p_store_name)) and is_active = true limit 1;
  if v_payee_id is null then
    insert into public.payees(user_id, name, type)
    values (v_user_id, trim(p_store_name), 'store') returning id into v_payee_id;
  end if;

  insert into public.transactions(user_id, account_id, category_id, payee_id, type, amount, currency, transaction_date, notes)
  values (v_user_id, p_account_id, p_category_id, v_payee_id, 'expense', p_total, v_account.currency, p_purchase_date,
    coalesce(nullif(trim(p_notes),''), 'Itemized purchase')) returning id into v_transaction_id;

  insert into public.purchases(user_id, transaction_id, store_id, account_id, category_id, purchase_date, currency, subtotal, tax, discount, total, notes)
  values (v_user_id, v_transaction_id, v_store_id, p_account_id, p_category_id, p_purchase_date, v_account.currency, v_subtotal, coalesce(p_tax,0), coalesce(p_discount,0), p_total, nullif(trim(p_notes),''))
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_line_total := round(v_qty * v_unit_price, 2);
    select id into v_product_id from public.products
      where user_id = v_user_id and lower(name) = lower(trim(v_item->>'name')) and is_active = true limit 1;
    if v_product_id is null then
      insert into public.products(user_id, name, default_category_id, default_unit)
      values (v_user_id, trim(v_item->>'name'), nullif(v_item->>'categoryId','')::uuid,
        coalesce(nullif(v_item->>'unit','')::public.purchase_unit, 'piece')) returning id into v_product_id;
    end if;
    insert into public.purchase_items(purchase_id, product_id, category_id, name, quantity, unit, unit_price, line_total)
    values (v_purchase_id, v_product_id, nullif(v_item->>'categoryId','')::uuid, trim(v_item->>'name'), v_qty,
      coalesce(nullif(v_item->>'unit','')::public.purchase_unit, 'piece'), v_unit_price, v_line_total);
  end loop;

  return v_purchase_id;
end;
$$;

grant execute on function public.create_purchase(text,text,uuid,uuid,date,numeric,numeric,numeric,text,jsonb) to authenticated;
