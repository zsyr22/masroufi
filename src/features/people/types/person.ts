export type PersonEntryType =
    | "paid_for_person"
    | "person_paid_for_me"
    | "repayment_received"
    | "repayment_sent"
    | "adjustment";

export type Person = {
    id: string;
    user_id: string;

    name: string;
    phone: string | null;
    notes: string | null;

    is_active: boolean;

    created_at: string;
    updated_at: string;
};

export type PersonBalance = {
    person_id: string;
    user_id: string;

    name: string;
    phone: string | null;
    notes: string | null;

    is_active: boolean;

    currency: "AED" | "USD" | null;

    current_balance: number;

    entries_count: number;

    last_entry_date: string | null;
};

export type PersonBalanceEntry = {
    id: string;

    user_id: string;

    person_id: string;

    transaction_id: string | null;

    entry_type: PersonEntryType;

    balance_effect: number;

    currency: "AED" | "USD";

    entry_date: string;

    description: string | null;

    created_at: string;
    updated_at: string;
};
export type BalanceStatus =
    | "owed_to_you"
    | "you_owe"
    | "settled";