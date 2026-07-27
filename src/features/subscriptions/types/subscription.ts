import type {
    AccountType,
    CurrencyCode,
} from "@/features/accounts/types/account";

export const subscriptionBillingCycles = [
    "one_time",
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
] as const;

export const subscriptionStatuses = [
    "active",
    "paused",
    "cancelled",
    "completed",
] as const;

export const subscriptionDurationTypes = [
    "ongoing",
    "fixed_period",
    "payment_count",
] as const;

export type SubscriptionBillingCycle =
    (typeof subscriptionBillingCycles)[number];

export type SubscriptionStatus =
    (typeof subscriptionStatuses)[number];

export type SubscriptionDurationType =
    (typeof subscriptionDurationTypes)[number];

export type Subscription = {
    id: string;
    user_id: string;

    name: string;
    provider: string | null;

    amount: number;
    currency: CurrencyCode;

    billing_cycle: SubscriptionBillingCycle;

    start_date: string;
    next_payment_date: string | null;

    duration_type: SubscriptionDurationType;
    duration_months: number | null;
    end_date: string | null;

    total_payments: number | null;
    payments_made: number;

    auto_renew: boolean;

    account_id: string | null;
    category_id: string | null;

    status: SubscriptionStatus;

    notes: string | null;
    last_paid_at: string | null;

    created_at: string;
    updated_at: string;
};

export type SubscriptionAccount = {
    id: string;
    name: string;
    type: AccountType;
    currency: CurrencyCode;
    is_active: boolean;
};

export type SubscriptionCategory = {
    id: string;
    name: string;
};

export type SubscriptionListItem =
    Subscription & {
        accounts: SubscriptionAccount | null;
        categories: SubscriptionCategory | null;
    };