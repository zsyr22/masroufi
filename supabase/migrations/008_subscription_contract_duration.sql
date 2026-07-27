-- =========================================================
-- Masroufi
-- Migration: 008
-- Subscription payment frequency and contract duration
-- =========================================================

-- ---------------------------------------------------------
-- 1. Add one-time payment frequency
-- ---------------------------------------------------------

alter type public.subscription_billing_cycle
add value if not exists 'one_time'
before 'weekly';

-- ---------------------------------------------------------
-- 2. Add completed status
-- ---------------------------------------------------------

alter type public.subscription_status
add value if not exists 'completed';

-- ---------------------------------------------------------
-- 3. Create duration type
-- ---------------------------------------------------------

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'subscription_duration_type'
    ) then
        create type public.subscription_duration_type as enum (
            'ongoing',
            'fixed_period',
            'payment_count'
        );
    end if;
end
$$;

-- ---------------------------------------------------------
-- 4. Add contract-related columns
-- ---------------------------------------------------------

alter table public.subscriptions
add column if not exists start_date date;

alter table public.subscriptions
add column if not exists duration_type
    public.subscription_duration_type
    not null
    default 'ongoing';

alter table public.subscriptions
add column if not exists duration_months integer;

alter table public.subscriptions
add column if not exists end_date date;

alter table public.subscriptions
add column if not exists total_payments integer;

alter table public.subscriptions
add column if not exists payments_made integer
    not null
    default 0;

alter table public.subscriptions
add column if not exists auto_renew boolean
    not null
    default false;

-- Existing subscriptions start from their current known date.
update public.subscriptions
set start_date = coalesce(
    start_date,
    last_paid_at,
    next_payment_date,
    current_date
)
where start_date is null;

alter table public.subscriptions
alter column start_date set not null;

-- A completed subscription no longer needs a next payment.
alter table public.subscriptions
alter column next_payment_date drop not null;

-- ---------------------------------------------------------
-- 5. Validation constraints
-- ---------------------------------------------------------

alter table public.subscriptions
drop constraint if exists subscriptions_duration_months_check;

alter table public.subscriptions
add constraint subscriptions_duration_months_check
check (
    (
        duration_type = 'fixed_period'
        and duration_months is not null
        and duration_months > 0
        and end_date is not null
    )
    or
    (
        duration_type <> 'fixed_period'
        and duration_months is null
        and end_date is null
    )
);

alter table public.subscriptions
drop constraint if exists subscriptions_total_payments_check;

alter table public.subscriptions
add constraint subscriptions_total_payments_check
check (
    (
        duration_type = 'payment_count'
        and total_payments is not null
        and total_payments > 0
    )
    or
    (
        duration_type <> 'payment_count'
        and total_payments is null
    )
);

alter table public.subscriptions
drop constraint if exists subscriptions_payments_made_check;

alter table public.subscriptions
add constraint subscriptions_payments_made_check
check (
    payments_made >= 0
);

alter table public.subscriptions
drop constraint if exists subscriptions_end_after_start_check;

alter table public.subscriptions
add constraint subscriptions_end_after_start_check
check (
    end_date is null
    or end_date >= start_date
);

-- ---------------------------------------------------------
-- 6. Indexes
-- ---------------------------------------------------------

create index if not exists subscriptions_end_date_idx
on public.subscriptions (
    user_id,
    end_date
);

-- ---------------------------------------------------------
-- 7. Permissions
-- ---------------------------------------------------------

grant usage on type
    public.subscription_duration_type
to authenticated;

grant select, insert, update, delete
on table public.subscriptions
to authenticated;