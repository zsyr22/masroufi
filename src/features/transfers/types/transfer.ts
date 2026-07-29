import type { CurrencyCode } from "@/features/accounts/types/account";

export type Transfer = {
    id: string;
    user_id: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    currency: CurrencyCode;
    transfer_date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type TransferListItem = Transfer & {
    from_account: {
        id: string;
        name: string;
        currency: CurrencyCode;
    } | null;

    to_account: {
        id: string;
        name: string;
        currency: CurrencyCode;
    } | null;
};