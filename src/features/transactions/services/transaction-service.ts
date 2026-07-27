import type {
    Transaction,
    TransactionPersonEntry,
    TransactionType,
} from "@/features/transactions/types/transaction";
import { createClient } from "@/lib/supabase/server";

export type TransactionListItem = Transaction & {
    accounts: {
        name: string;
    } | null;

    categories: {
        name: string;
    } | null;

    payees: {
        name: string;
    } | null;

    person_balance_entries: TransactionPersonEntry[];
};

export type TransactionFilters = {
    date?: string;
    type?: TransactionType | "all";
    accountId?: string;
};

export async function getCurrentUserTransactions(
    filters: TransactionFilters = {}
): Promise<TransactionListItem[]> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    let query = supabase
        .from("transactions")
        .select(`
            *,
            accounts (
                name
            ),
            categories (
                name
            ),
            payees (
                name
            ),
            person_balance_entries (
                entry_type,
                people (
                    name
                )
            )
        `)
        .eq("user_id", user.id);

    if (filters.date) {
        query = query.eq(
            "transaction_date",
            filters.date
        );
    }

    if (
        filters.type &&
        filters.type !== "all"
    ) {
        query = query.eq(
            "type",
            filters.type
        );
    }

    if (filters.accountId) {
        query = query.eq(
            "account_id",
            filters.accountId
        );
    }

    const { data, error } = await query
        .order("transaction_date", {
            ascending: false,
        })
        .order("created_at", {
            ascending: false,
        });

    if (error) {
        console.error(
            "Load transactions error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return [];
    }

    return (data ?? []) as TransactionListItem[];
}

export async function getCurrentUserTransactionById(
    transactionId: string
) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from("transactions")
        .select(`
            id,
            type,
            amount,
            currency,
            transaction_date,
            notes,
            account_id,
            category_id,
            payee_id,
            accounts (
                id,
                name,
                currency
            ),
            categories (
                id,
                name,
                transaction_type
            ),
            payees (
                id,
                name,
                type
            )
        `)
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Get transaction by id error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return null;
    }

    return data;
}