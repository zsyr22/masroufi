export const accountTypes = ["bank", "cash", "savings"] as const;
export const currencyCodes = ["AED", "USD"] as const;

export type AccountType = (typeof accountTypes)[number];
export type CurrencyCode = (typeof currencyCodes)[number];

export type Account = {
    id: string;
    user_id: string;
    name: string;
    type: AccountType;
    currency: CurrencyCode;
    opening_balance: number;
    is_active: boolean;
    is_included_in_available_balance: boolean;
    created_at: string;
    updated_at: string;
};