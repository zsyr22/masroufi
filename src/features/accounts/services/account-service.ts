import type {
    Account,
    AccountWithBalance,
} from "@/features/accounts/types/account";
import type {
    AccountActivityItem,
    AccountDetailsData,
} from "@/features/accounts/types/account-activity";
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

export async function getCurrentUserAccountDetails(
    accountId: string
): Promise<AccountDetailsData | null> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const [accountResult, transactionsResult, transfersResult] =
        await Promise.all([
            supabase
                .from("accounts")
                .select("*")
                .eq("id", accountId)
                .eq("user_id", user.id)
                .maybeSingle(),
            supabase
                .from("transactions")
                .select(
                    "id, type, amount, currency, transaction_date, notes, created_at, category_id, payee_id, categories(name), payees(name)"
                )
                .eq("user_id", user.id)
                .eq("account_id", accountId)
                .order("transaction_date", { ascending: false })
                .order("created_at", { ascending: false }),
            supabase
                .from("transfers")
                .select(
                    "id, from_account_id, to_account_id, amount, currency, transfer_date, notes, created_at, from_account:accounts!transfers_from_account_id_fkey(name), to_account:accounts!transfers_to_account_id_fkey(name)"
                )
                .eq("user_id", user.id)
                .or(
                    `from_account_id.eq.${accountId},to_account_id.eq.${accountId}`
                )
                .order("transfer_date", { ascending: false })
                .order("created_at", { ascending: false }),
        ]);

    if (accountResult.error || !accountResult.data) {
        if (accountResult.error) {
            console.error("Load account details error:", accountResult.error);
        }
        return null;
    }

    if (transactionsResult.error) {
        console.error(
            "Load account detail transactions error:",
            transactionsResult.error
        );
    }

    if (transfersResult.error) {
        console.error(
            "Load account detail transfers error:",
            transfersResult.error
        );
    }

    const account = accountResult.data as Account;
    const transactions = transactionsResult.data ?? [];
    const transfers = transfersResult.data ?? [];

    let transactionIncome = 0;
    let transactionExpenses = 0;
    let transfersIn = 0;
    let transfersOut = 0;

    const activities: AccountActivityItem[] = [];

    for (const transaction of transactions) {
        const amount = Number(transaction.amount);
        const category = Array.isArray(transaction.categories)
            ? transaction.categories[0]
            : transaction.categories;
        const payee = Array.isArray(transaction.payees)
            ? transaction.payees[0]
            : transaction.payees;

        if (transaction.type === "income") {
            transactionIncome += amount;
        } else {
            transactionExpenses += amount;
        }

        activities.push({
            id: `transaction-${transaction.id}`,
            kind: transaction.type,
            title:
                payee?.name ??
                category?.name ??
                (transaction.type === "income" ? "Income" : "Expense"),
            subtitle: [category?.name, transaction.notes]
                .filter(Boolean)
                .join(" · ") || null,
            amount:
                transaction.type === "income" ? amount : -amount,
            currency: transaction.currency,
            occurredAt:
                transaction.transaction_date ?? transaction.created_at,
            sourceId: transaction.id,
        });
    }

    for (const transfer of transfers) {
        const amount = Number(transfer.amount);
        const fromAccount = Array.isArray(transfer.from_account)
            ? transfer.from_account[0]
            : transfer.from_account;
        const toAccount = Array.isArray(transfer.to_account)
            ? transfer.to_account[0]
            : transfer.to_account;
        const isIncoming = transfer.to_account_id === accountId;

        if (isIncoming) {
            transfersIn += amount;
        } else {
            transfersOut += amount;
        }

        activities.push({
            id: `transfer-${transfer.id}`,
            kind: isIncoming ? "transfer_in" : "transfer_out",
            title: isIncoming
                ? `Transfer from ${fromAccount?.name ?? "another account"}`
                : `Transfer to ${toAccount?.name ?? "another account"}`,
            subtitle: transfer.notes,
            amount: isIncoming ? amount : -amount,
            currency: transfer.currency,
            occurredAt: transfer.transfer_date ?? transfer.created_at,
            sourceId: transfer.id,
        });
    }

    activities.push({
        id: `opening-${account.id}`,
        kind: "opening_balance",
        title: "Opening balance",
        subtitle: "Account starting point",
        amount: Number(account.opening_balance),
        currency: account.currency,
        occurredAt: account.created_at,
        sourceId: null,
    });

    activities.sort(
        (left, right) =>
            new Date(right.occurredAt).getTime() -
            new Date(left.occurredAt).getTime()
    );

    const moneyIn = transactionIncome + transfersIn;
    const moneyOut = transactionExpenses + transfersOut;
    const currentBalance =
        Number(account.opening_balance) + moneyIn - moneyOut;

    return {
        account: {
            ...account,
            current_balance: currentBalance,
        },
        moneyIn,
        moneyOut,
        transactionIncome,
        transactionExpenses,
        transfersIn,
        transfersOut,
        activities,
    };
}
