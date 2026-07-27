create type public.subscription_billing_cycle as enum (
    'weekly',
    'monthly',
    'quarterly',
    'yearly'
);

create type public.subscription_status as enum (
    'active',
    'paused',
    'cancelled'
);

create table public.subscriptions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    name text not null
        check (
            char_length(trim(name)) between 1 and 100
        ),

    provider text
        check (
            provider is null
            or char_length(trim(provider)) <= 100
        ),

    amount numeric(14, 2) not null
        check (amount > 0),

    currency public.currency_code not null
        default 'AED',

    billing_cycle public.subscription_billing_cycle not null,

    next_payment_date date not null,

    account_id uuid
        references public.accounts(id)
        on delete set null,

    category_id uuid
        references public.categories(id)
        on delete set null,

    status public.subscription_status not null
        default 'active',

    notes text
        check (
            notes is null
            or char_length(notes) <= 500
        ),

    last_paid_at date,

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()
);

create index subscriptions_user_id_idx
    on public.subscriptions(user_id);

create index subscriptions_user_status_idx
    on public.subscriptions(user_id, status);

create index subscriptions_next_payment_date_idx
    on public.subscriptions(
        user_id,
        next_payment_date
    );

create index subscriptions_account_id_idx
    on public.subscriptions(account_id);

create index subscriptions_category_id_idx
    on public.subscriptions(category_id);

alter table public.subscriptions
enable row level security;

create policy
    "Users can view their own subscriptions"
on public.subscriptions
for select
to authenticated
using (
    auth.uid() = user_id
);

create policy
    "Users can create their own subscriptions"
on public.subscriptions
for insert
to authenticated
with check (
    auth.uid() = user_id
);

create policy
    "Users can update their own subscriptions"
on public.subscriptions
for update
to authenticated
using (
    auth.uid() = user_id
)
with check (
    auth.uid() = user_id
);

create policy
    "Users can delete their own subscriptions"
on public.subscriptions
for delete
to authenticated
using (
    auth.uid() = user_id
);

create or replace function public.set_subscription_updated_at()
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

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_subscription_updated_at();

grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.subscriptions
to authenticated;