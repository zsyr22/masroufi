import type { CurrencyCode } from "@/features/accounts/types/account";
import type { TransactionListItem } from "@/features/transactions/services/transaction-service";

type CurrencyTotals = Record<CurrencyCode, number>;

export type MonthlyTransactionSummary = {
    income: CurrencyTotals;
    expenses: CurrencyTotals;
};

function emptyTotals(): CurrencyTotals {
    return {
        AED: 0,
        USD: 0,
    };
}

function getCurrentMonthKey(): string {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dubai",
        year: "numeric",
        month: "2-digit",
    });

    return formatter.format(new Date()).slice(0, 7);
}

export function calculateMonthlyTransactionSummary(
    transactions: TransactionListItem[]
): MonthlyTransactionSummary {
    const summary: MonthlyTransactionSummary = {
        income: emptyTotals(),
        expenses: emptyTotals(),
    };

    const currentMonth = getCurrentMonthKey();

    for (const transaction of transactions) {
        if (!transaction.transaction_date.startsWith(currentMonth)) {
            continue;
        }

        const amount = Number(transaction.amount);
        const currency = transaction.currency;

        if (transaction.type === "income") {
            summary.income[currency] += amount;
        } else {
            summary.expenses[currency] += amount;
        }
    }

    return summary;
}

export function formatTransactionDate(date: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
}