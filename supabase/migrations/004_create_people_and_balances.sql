-- =========================================================
-- PEOPLE & BALANCES
-- =========================================================

-- نوع حركة دفتر الشخص
create type public.person_entry_type as enum (
  'paid_for_person',
  'person_paid_for_me',
  'repayment_received',
  'repayment_sent',
  'adjustment'
);

-- =========================================================
-- PEOPLE
-- =========================================================

create table public.people (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null,
  phone text,
  notes text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint people_name_length_check
    check (
      char_length(trim(name)) between 1 and 100
    ),

  constraint people_phone_length_check
    check (
      phone is null
      or char_length(trim(phone)) between 1 and 30
    ),

  constraint people_notes_length_check
    check (
      notes is null
      or char_length(notes) <= 500
    )
);

create index people_user_id_idx
  on public.people(user_id);

create index people_user_active_idx
  on public.people(user_id, is_active);

create unique index people_user_name_unique_idx
  on public.people(
    user_id,
    lower(trim(name))
  )
  where is_active = true;

-- =========================================================
-- PERSON BALANCE ENTRIES
-- =========================================================

create table public.person_balance_entries (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  person_id uuid not null
    references public.people(id)
    on delete cascade,

  transaction_id uuid
    references public.transactions(id)
    on delete set null,

  entry_type public.person_entry_type not null,

  /*
    balance_effect:
      Positive = the person owes the user more
      Negative = the user owes the person more

    Examples:
      I paid 300 AED for Ahmed       => +300
      Ahmed repaid me 100 AED        => -100
      Ahmed paid 120 AED for me      => -120
      I repaid Ahmed 50 AED          => +50
  */
  balance_effect numeric(14, 2) not null,

  currency public.currency_code not null default 'AED',

  entry_date date not null default current_date,

  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint person_balance_effect_not_zero_check
    check (balance_effect <> 0),

  constraint person_balance_description_length_check
    check (
      description is null
      or char_length(description) <= 500
    )
);

create index person_balance_entries_user_id_idx
  on public.person_balance_entries(user_id);

create index person_balance_entries_person_id_idx
  on public.person_balance_entries(person_id);

create index person_balance_entries_transaction_id_idx
  on public.person_balance_entries(transaction_id);

create index person_balance_entries_person_date_idx
  on public.person_balance_entries(
    person_id,
    entry_date desc,
    created_at desc
  );

create index person_balance_entries_user_currency_idx
  on public.person_balance_entries(
    user_id,
    currency
  );

-- كل Transaction مرتبطة بشخص واحد فقط حالياً.
-- لاحقاً يمكن إزالة هذا القيد إذا أضفنا تقسيم فاتورة على عدة أشخاص.
create unique index person_balance_entries_transaction_unique_idx
  on public.person_balance_entries(transaction_id)
  where transaction_id is not null;

-- =========================================================
-- AUTOMATIC updated_at
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_people_updated_at
before update on public.people
for each row
execute function public.set_updated_at();

create trigger set_person_balance_entries_updated_at
before update on public.person_balance_entries
for each row
execute function public.set_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.people enable row level security;
alter table public.person_balance_entries enable row level security;

-- People policies

create policy "Users can view own people"
on public.people
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "Users can create own people"
on public.people
for insert
to authenticated
with check (
  auth.uid() = user_id
);

create policy "Users can update own people"
on public.people
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "Users can delete own people"
on public.people
for delete
to authenticated
using (
  auth.uid() = user_id
);

-- Balance entry policies

create policy "Users can view own person balance entries"
on public.person_balance_entries
for select
to authenticated
using (
  auth.uid() = user_id
);

create policy "Users can create own person balance entries"
on public.person_balance_entries
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.people
    where people.id = person_balance_entries.person_id
      and people.user_id = auth.uid()
  )
);

create policy "Users can update own person balance entries"
on public.person_balance_entries
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.people
    where people.id = person_balance_entries.person_id
      and people.user_id = auth.uid()
  )
);

create policy "Users can delete own person balance entries"
on public.person_balance_entries
for delete
to authenticated
using (
  auth.uid() = user_id
);

-- =========================================================
-- VIEW: CURRENT PERSON BALANCES
-- =========================================================

create or replace view public.person_current_balances
with (security_invoker = true)
as
select
  people.id as person_id,
  people.user_id,
  people.name,
  people.phone,
  people.notes,
  people.is_active,

  entries.currency,

  coalesce(
    sum(entries.balance_effect),
    0
  )::numeric(14, 2) as current_balance,

  count(entries.id)::integer as entries_count,

  max(entries.entry_date) as last_entry_date

from public.people

left join public.person_balance_entries as entries
  on entries.person_id = people.id
  and entries.user_id = people.user_id

group by
  people.id,
  people.user_id,
  people.name,
  people.phone,
  people.notes,
  people.is_active,
  entries.currency;