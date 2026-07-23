import type { Transaction } from "@/features/transactions/types/transaction";
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
};

export async function getCurrentUserTransactions(): Promise<
    TransactionListItem[]
> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
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
      )
    `)
        .eq("user_id", user.id)
        .order("transaction_date", {
            ascending: false,
        })
        .order("created_at", {
            ascending: false,
        });

    if (error) {
        console.error("Load transactions error:", error);
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
        console.error("Get transaction by id error:", error);
        return null;
    }

    return data;
}