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