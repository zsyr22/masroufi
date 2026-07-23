import type {
    Account,
    AccountWithBalance,
} from "@/features/accounts/types/account";
import { createClient } from "@/lib/supabase/server";

type AccountTransactionRow = {
    account_id: string;
    type: "income" | "expense";
    amount: number;
};

export async function getCurrentUserAccounts(): Promise<
    AccountWithBalance[]
> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const [
        { data: accountsData, error: accountsError },
        { data: transactionsData, error: transactionsError },
    ] = await Promise.all([
        supabase
            .from("accounts")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", {
                ascending: true,
            }),

        supabase
            .from("transactions")
            .select("account_id, type, amount")
            .eq("user_id", user.id),
    ]);

    if (accountsError) {
        console.error("Load accounts error:", accountsError);
        return [];
    }

    if (transactionsError) {
        console.error(
            "Load account transactions error:",
            transactionsError
        );
    }

    const accounts = (accountsData ?? []) as Account[];
    const transactions =
        (transactionsData ?? []) as AccountTransactionRow[];

    const changesByAccount = new Map<string, number>();

    for (const transaction of transactions) {
        const currentChange =
            changesByAccount.get(transaction.account_id) ?? 0;

        const amount = Number(transaction.amount);

        const signedAmount =
            transaction.type === "income" ? amount : -amount;

        changesByAccount.set(
            transaction.account_id,
            currentChange + signedAmount
        );
    }

    return accounts.map((account) => ({
        ...account,
        current_balance:
            Number(account.opening_balance) +
            (changesByAccount.get(account.id) ?? 0),
    }));
}