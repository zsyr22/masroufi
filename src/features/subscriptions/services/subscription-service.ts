import type {
    Subscription,
    SubscriptionListItem,
} from "@/features/subscriptions/types/subscription";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserSubscriptions(): Promise<
    SubscriptionListItem[]
> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from("subscriptions")
        .select(`
            *,
            accounts (
                id,
                name,
                type,
                currency,
                is_active
            ),
            categories (
                id,
                name
            ),
            subscription_payments (
                id,
                subscription_id,
                transaction_id,
                amount,
                paid_at,
                notes,
                created_at,
                transaction:transactions (
                    id,
                    account_id,
                    account:accounts (
                        name
                    )
                )
            )
        `)
        .eq("user_id", user.id)
        .order("status", {
            ascending: true,
        })
        .order("next_payment_date", {
            ascending: true,
            nullsFirst: false,
        })
        .order("created_at", {
            ascending: false,
        });

    if (error) {
        console.error(
            "Load subscriptions error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return [];
    }

    return (data ??
        []) as SubscriptionListItem[];
}

export async function getCurrentUserSubscriptionById(
    subscriptionId: string
): Promise<SubscriptionListItem | null> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from("subscriptions")
        .select(`
            *,
            accounts (
                id,
                name,
                type,
                currency,
                is_active
            ),
            categories (
                id,
                name
            ),
            subscription_payments (
                id,
                subscription_id,
                transaction_id,
                amount,
                paid_at,
                notes,
                created_at,
                transaction:transactions (
                    id,
                    account_id,
                    account:accounts (
                        name
                    )
                )
            )
        `)
        .eq("id", subscriptionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Load subscription error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return null;
    }

    return data as SubscriptionListItem | null;
}

export async function getCurrentUserUpcomingSubscriptions(
    limit = 5
): Promise<SubscriptionListItem[]> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from("subscriptions")
        .select(`
            *,
            accounts (
                id,
                name,
                type,
                currency,
                is_active
            ),
            categories (
                id,
                name
            ),
            subscription_payments (
                id,
                subscription_id,
                transaction_id,
                amount,
                paid_at,
                notes,
                created_at,
                transaction:transactions (
                    id,
                    account_id,
                    account:accounts (
                        name
                    )
                )
            )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .not("next_payment_date", "is", null)
        .order("next_payment_date", {
            ascending: true,
            nullsFirst: false,
        })
        .limit(limit);

    if (error) {
        console.error(
            "Load upcoming subscriptions error:",
            error
        );

        return [];
    }

    return (data ??
        []) as SubscriptionListItem[];
}

export async function getSubscriptionRecordById(
    subscriptionId: string
): Promise<Subscription | null> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Load subscription record error:",
            error
        );

        return null;
    }

    return data as Subscription | null;
}