import type { TransactionListItem } from "@/features/transactions/services/transaction-service";

export type TransactionDateGroup = {
    date: string;
    label: string;
    transactions: TransactionListItem[];
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
};

function getLocalDateString(date: Date): string {
    const timezoneOffset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
}

function getDateLabel(dateValue: string): string {
    const today = new Date();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todayString = getLocalDateString(today);
    const yesterdayString = getLocalDateString(yesterday);

    if (dateValue === todayString) {
        return "Today";
    }

    if (dateValue === yesterdayString) {
        return "Yesterday";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

export function groupTransactionsByDate(
    transactions: TransactionListItem[]
): TransactionDateGroup[] {
    const groups = new Map<
        string,
        TransactionListItem[]
    >();

    for (const transaction of transactions) {
        const currentGroup =
            groups.get(transaction.transaction_date) ?? [];

        currentGroup.push(transaction);

        groups.set(
            transaction.transaction_date,
            currentGroup
        );
    }

    return Array.from(groups.entries()).map(
        ([date, groupedTransactions]) => {
            const totalIncome = groupedTransactions
                .filter(
                    (transaction) =>
                        transaction.type === "income"
                )
                .reduce(
                    (total, transaction) =>
                        total + Number(transaction.amount),
                    0
                );

            const totalExpenses = groupedTransactions
                .filter(
                    (transaction) =>
                        transaction.type === "expense"
                )
                .reduce(
                    (total, transaction) =>
                        total + Number(transaction.amount),
                    0
                );

            return {
                date,
                label: getDateLabel(date),
                transactions: groupedTransactions,
                totalIncome,
                totalExpenses,
                netAmount: totalIncome - totalExpenses,
            };
        }
    );
}