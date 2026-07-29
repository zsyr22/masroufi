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

type AccountTransferRow = {
    from_account_id: string;
    to_account_id: string;
    amount: number;
};

function calculateAccountsWithBalances({
    accounts,
    transactions,
    transfers,
}: {
    accounts: Account[];
    transactions: AccountTransactionRow[];
    transfers: AccountTransferRow[];
}): AccountWithBalance[] {
    const changesByAccount =
        new Map<string, number>();

    function addBalanceChange(
        accountId: string,
        change: number
    ) {
        const currentChange =
            changesByAccount.get(accountId) ??
            0;

        changesByAccount.set(
            accountId,
            currentChange + change
        );
    }

    for (const transaction of transactions) {
        const amount = Number(
            transaction.amount
        );

        const signedAmount =
            transaction.type === "income"
                ? amount
                : -amount;

        addBalanceChange(
            transaction.account_id,
            signedAmount
        );
    }

    for (const transfer of transfers) {
        const amount = Number(
            transfer.amount
        );

        addBalanceChange(
            transfer.from_account_id,
            -amount
        );

        addBalanceChange(
            transfer.to_account_id,
            amount
        );
    }

    return accounts.map((account) => ({
        ...account,
        current_balance:
            Number(
                account.opening_balance
            ) +
            (changesByAccount.get(
                account.id
            ) ?? 0),
    }));
}

async function loadAccountBalanceData({
    active,
}: {
    active: boolean;
}): Promise<AccountWithBalance[]> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const [
        {
            data: accountsData,
            error: accountsError,
        },
        {
            data: transactionsData,
            error: transactionsError,
        },
        {
            data: transfersData,
            error: transfersError,
        },
    ] = await Promise.all([
        supabase
            .from("accounts")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", active)
            .order(
                active
                    ? "created_at"
                    : "updated_at",
                {
                    ascending: active,
                }
            ),

        supabase
            .from("transactions")
            .select(
                "account_id, type, amount"
            )
            .eq("user_id", user.id),

        supabase
            .from("transfers")
            .select(
                "from_account_id, to_account_id, amount"
            )
            .eq("user_id", user.id),
    ]);

    if (accountsError) {
        console.error(
            active
                ? "Load accounts error:"
                : "Load archived accounts error:",
            {
                message:
                    accountsError.message,
                details:
                    accountsError.details,
                hint: accountsError.hint,
                code: accountsError.code,
            }
        );

        return [];
    }

    if (transactionsError) {
        console.error(
            "Load account transactions error:",
            {
                message:
                    transactionsError.message,
                details:
                    transactionsError.details,
                hint:
                    transactionsError.hint,
                code:
                    transactionsError.code,
            }
        );
    }

    if (transfersError) {
        console.error(
            "Load account transfers error:",
            {
                message:
                    transfersError.message,
                details:
                    transfersError.details,
                hint: transfersError.hint,
                code: transfersError.code,
            }
        );
    }

    return calculateAccountsWithBalances({
        accounts:
            (accountsData ?? []) as Account[],
        transactions:
            (transactionsData ??
                []) as AccountTransactionRow[],
        transfers:
            (transfersData ??
                []) as AccountTransferRow[],
    });
}

export async function getCurrentUserAccounts(): Promise<
    AccountWithBalance[]
> {
    return loadAccountBalanceData({
        active: true,
    });
}

export async function getCurrentUserArchivedAccounts(): Promise<
    AccountWithBalance[]
> {
    return loadAccountBalanceData({
        active: false,
    });
}