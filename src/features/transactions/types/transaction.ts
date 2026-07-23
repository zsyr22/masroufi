import type { CurrencyCode } from "@/features/accounts/types/account";

export const transactionTypes = [
    "income",
    "expense",
] as const;

export type TransactionType =
    (typeof transactionTypes)[number];

export type Category = {
    id: string;
    user_id: string;
    name: string;
    transaction_type: TransactionType;
    is_system: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type PayeeType =
    | "store"
    | "restaurant"
    | "company"
    | "government"
    | "person"
    | "other";

export type Payee = {
    id: string;
    user_id: string;
    name: string;
    type: PayeeType;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type Transaction = {
    id: string;
    user_id: string;
    account_id: string;
    category_id: string;
    payee_id: string | null;
    type: TransactionType;
    amount: number;
    currency: CurrencyCode;
    transaction_date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
};