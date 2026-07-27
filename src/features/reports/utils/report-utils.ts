import type { CurrencyCode } from "@/features/accounts/types/account";
import type { SubscriptionListItem } from "@/features/subscriptions/types/subscription";
import {
    calculateMonthlyEquivalent,
    calculateYearlyEquivalent,
} from "@/features/subscriptions/utils/subscription-utils";
import type { TransactionListItem } from "@/features/transactions/services/transaction-service";

export type CurrencyAmounts = Record<
    CurrencyCode,
    number
>;

export type ReportBreakdownItem = {
    id: string;
    name: string;
    amount: CurrencyAmounts;
    transactionCount: number;
};

export type MonthlyReportItem = {
    monthKey: string;
    monthLabel: string;
    income: CurrencyAmounts;
    expenses: CurrencyAmounts;
    net: CurrencyAmounts;
};

export type ReportsSummary = {
    income: CurrencyAmounts;
    expenses: CurrencyAmounts;
    net: CurrencyAmounts;
    averageDailyExpenses: CurrencyAmounts;
    transactionCount: number;
};

export type SubscriptionReportSummary = {
    activeCount: number;
    monthly: CurrencyAmounts;
    yearly: CurrencyAmounts;
};

function createEmptyCurrencyAmounts(): CurrencyAmounts {
    return {
        AED: 0,
        USD: 0,
    };
}

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

function getLocalDateParts(dateValue: string): {
    year: number;
    month: number;
    day: number;
} {
    const [year, month, day] = dateValue
        .split("-")
        .map(Number);

    return {
        year,
        month,
        day,
    };
}

function getCurrentMonthKey(): string {
    const now = new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
}

function getTransactionMonthKey(
    transactionDate: string
): string {
    return transactionDate.slice(0, 7);
}

function getDaysElapsedInCurrentMonth(): number {
    return Math.max(new Date().getDate(), 1);
}

export function isTransactionInCurrentMonth(
    transactionDate: string
): boolean {
    return (
        getTransactionMonthKey(transactionDate) ===
        getCurrentMonthKey()
    );
}

export function getCurrentMonthTransactions(
    transactions: TransactionListItem[]
): TransactionListItem[] {
    return transactions.filter((transaction) =>
        isTransactionInCurrentMonth(
            transaction.transaction_date
        )
    );
}

export function calculateReportsSummary(
    transactions: TransactionListItem[]
): ReportsSummary {
    const currentMonthTransactions =
        getCurrentMonthTransactions(transactions);

    const income = createEmptyCurrencyAmounts();
    const expenses = createEmptyCurrencyAmounts();

    for (const transaction of currentMonthTransactions) {
        const amount = Number(transaction.amount);
        const currency = transaction.currency;

        if (transaction.type === "income") {
            income[currency] += amount;
        } else {
            expenses[currency] += amount;
        }
    }

    const daysElapsed =
        getDaysElapsedInCurrentMonth();

    return {
        income: {
            AED: roundMoney(income.AED),
            USD: roundMoney(income.USD),
        },

        expenses: {
            AED: roundMoney(expenses.AED),
            USD: roundMoney(expenses.USD),
        },

        net: {
            AED: roundMoney(
                income.AED - expenses.AED
            ),
            USD: roundMoney(
                income.USD - expenses.USD
            ),
        },

        averageDailyExpenses: {
            AED: roundMoney(
                expenses.AED / daysElapsed
            ),
            USD: roundMoney(
                expenses.USD / daysElapsed
            ),
        },

        transactionCount:
            currentMonthTransactions.length,
    };
}

export function calculateCategoryBreakdown(
    transactions: TransactionListItem[]
): ReportBreakdownItem[] {
    const currentMonthExpenses =
        getCurrentMonthTransactions(
            transactions
        ).filter(
            (transaction) =>
                transaction.type === "expense"
        );

    const breakdown = new Map<
        string,
        ReportBreakdownItem
    >();

    for (const transaction of currentMonthExpenses) {
        const categoryId =
            transaction.category_id;

        const categoryName =
            transaction.categories?.name ??
            "Uncategorized";

        const current =
            breakdown.get(categoryId) ?? {
                id: categoryId,
                name: categoryName,
                amount: createEmptyCurrencyAmounts(),
                transactionCount: 0,
            };

        current.amount[
            transaction.currency
        ] += Number(transaction.amount);

        current.transactionCount += 1;

        breakdown.set(categoryId, current);
    }

    return Array.from(breakdown.values())
        .map((item) => ({
            ...item,
            amount: {
                AED: roundMoney(item.amount.AED),
                USD: roundMoney(item.amount.USD),
            },
        }))
        .sort(
            (first, second) =>
                second.amount.AED -
                first.amount.AED ||
                second.amount.USD -
                first.amount.USD
        );
}

export function calculateAccountBreakdown(
    transactions: TransactionListItem[]
): ReportBreakdownItem[] {
    const currentMonthExpenses =
        getCurrentMonthTransactions(
            transactions
        ).filter(
            (transaction) =>
                transaction.type === "expense"
        );

    const breakdown = new Map<
        string,
        ReportBreakdownItem
    >();

    for (const transaction of currentMonthExpenses) {
        const accountId =
            transaction.account_id;

        const accountName =
            transaction.accounts?.name ??
            "Unknown account";

        const current =
            breakdown.get(accountId) ?? {
                id: accountId,
                name: accountName,
                amount: createEmptyCurrencyAmounts(),
                transactionCount: 0,
            };

        current.amount[
            transaction.currency
        ] += Number(transaction.amount);

        current.transactionCount += 1;

        breakdown.set(accountId, current);
    }

    return Array.from(breakdown.values())
        .map((item) => ({
            ...item,
            amount: {
                AED: roundMoney(item.amount.AED),
                USD: roundMoney(item.amount.USD),
            },
        }))
        .sort(
            (first, second) =>
                second.amount.AED -
                first.amount.AED ||
                second.amount.USD -
                first.amount.USD
        );
}

function getLastMonthKeys(
    monthCount: number
): Array<{
    monthKey: string;
    monthLabel: string;
}> {
    const now = new Date();

    return Array.from(
        { length: monthCount },
        (_, index) => {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() -
                (monthCount - 1 - index),
                1
            );

            const monthKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

            const monthLabel =
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        month: "short",
                        year: "2-digit",
                    }
                ).format(date);

            return {
                monthKey,
                monthLabel,
            };
        }
    );
}

export function calculateMonthlyComparison(
    transactions: TransactionListItem[],
    monthCount = 6
): MonthlyReportItem[] {
    const months =
        getLastMonthKeys(monthCount);

    const reports = new Map<
        string,
        MonthlyReportItem
    >(
        months.map((month) => [
            month.monthKey,
            {
                monthKey: month.monthKey,
                monthLabel: month.monthLabel,
                income: createEmptyCurrencyAmounts(),
                expenses:
                    createEmptyCurrencyAmounts(),
                net: createEmptyCurrencyAmounts(),
            },
        ])
    );

    for (const transaction of transactions) {
        const monthKey =
            getTransactionMonthKey(
                transaction.transaction_date
            );

        const report = reports.get(monthKey);

        if (!report) {
            continue;
        }

        const amount = Number(
            transaction.amount
        );

        if (transaction.type === "income") {
            report.income[
                transaction.currency
            ] += amount;
        } else {
            report.expenses[
                transaction.currency
            ] += amount;
        }
    }

    return months.map(({ monthKey }) => {
        const report = reports.get(monthKey);

        if (!report) {
            throw new Error(
                `Missing report month: ${monthKey}`
            );
        }

        return {
            ...report,

            income: {
                AED: roundMoney(
                    report.income.AED
                ),
                USD: roundMoney(
                    report.income.USD
                ),
            },

            expenses: {
                AED: roundMoney(
                    report.expenses.AED
                ),
                USD: roundMoney(
                    report.expenses.USD
                ),
            },

            net: {
                AED: roundMoney(
                    report.income.AED -
                    report.expenses.AED
                ),
                USD: roundMoney(
                    report.income.USD -
                    report.expenses.USD
                ),
            },
        };
    });
}

export function getLargestExpenses(
    transactions: TransactionListItem[],
    limit = 5
): TransactionListItem[] {
    return getCurrentMonthTransactions(
        transactions
    )
        .filter(
            (transaction) =>
                transaction.type === "expense"
        )
        .sort(
            (first, second) =>
                Number(second.amount) -
                Number(first.amount)
        )
        .slice(0, limit);
}

export function calculateSubscriptionReportSummary(
    subscriptions: SubscriptionListItem[]
): SubscriptionReportSummary {
    const activeSubscriptions =
        subscriptions.filter(
            (subscription) =>
                subscription.status === "active"
        );

    const monthly =
        createEmptyCurrencyAmounts();

    const yearly =
        createEmptyCurrencyAmounts();

    for (const subscription of activeSubscriptions) {
        if (
            subscription.billing_cycle ===
            "one_time"
        ) {
            continue;
        }

        monthly[
            subscription.currency
        ] += calculateMonthlyEquivalent(
            Number(subscription.amount),
            subscription.billing_cycle
        );

        yearly[
            subscription.currency
        ] += calculateYearlyEquivalent(
            Number(subscription.amount),
            subscription.billing_cycle
        );
    }

    return {
        activeCount:
            activeSubscriptions.length,

        monthly: {
            AED: roundMoney(monthly.AED),
            USD: roundMoney(monthly.USD),
        },

        yearly: {
            AED: roundMoney(yearly.AED),
            USD: roundMoney(yearly.USD),
        },
    };
}

export function getCurrentMonthLabel(): string {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            year: "numeric",
        }
    ).format(new Date());
}

export function formatReportDate(
    dateValue: string
): string {
    const { year, month, day } =
        getLocalDateParts(dateValue);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    ).format(
        new Date(
            year,
            month - 1,
            day
        )
    );
}