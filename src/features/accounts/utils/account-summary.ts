import type {
    AccountWithBalance,
    CurrencyCode,
} from "@/features/accounts/types/account";

export type CurrencyBalances = Record<CurrencyCode, number>;

export type AccountSummary = {
    available: CurrencyBalances;
    savings: CurrencyBalances;
    total: CurrencyBalances;
};

function createEmptyBalances(): CurrencyBalances {
    return {
        AED: 0,
        USD: 0,
    };
}

export function calculateAccountSummary(
    accounts: AccountWithBalance[]
): AccountSummary {
    const summary: AccountSummary = {
        available: createEmptyBalances(),
        savings: createEmptyBalances(),
        total: createEmptyBalances(),
    };

    for (const account of accounts) {
        const balance = Number(account.current_balance);
        const currency = account.currency;

        summary.total[currency] += balance;

        if (account.type === "savings") {
            summary.savings[currency] += balance;
        }

        if (account.is_included_in_available_balance) {
            summary.available[currency] += balance;
        }
    }

    return summary;
}

export function formatMoney(
    amount: number,
    currency: CurrencyCode
): string {
    const formattedAmount = new Intl.NumberFormat("en-AE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    return `${formattedAmount} ${currency}`;
}