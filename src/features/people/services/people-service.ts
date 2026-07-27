import { createClient } from "@/lib/supabase/server";

import type {
    Person,
    PersonBalance,
    PersonBalanceEntry,
} from "@/features/people/types/person";

export async function getCurrentUserPeopleBalances(): Promise<
    PersonBalance[]
> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("person_current_balances")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error("Load people balances error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return [];
    }

    return (data ?? []).map((person) => ({
        ...person,
        current_balance: Number(person.current_balance),
        entries_count: Number(person.entries_count),
    })) as PersonBalance[];
}


export async function getCurrentUserPersonById(
    personId: string
): Promise<Person | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("id", personId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Load person error:",
            error
        );

        return null;
    }

    return data as Person | null;
}

export async function getPersonLedger(
    personId: string
): Promise<PersonBalanceEntry[]> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("person_balance_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("person_id", personId)
        .order("entry_date", {
            ascending: false,
        })
        .order("created_at", {
            ascending: false,
        });

    if (error) {
        console.error(
            "Load ledger error:",
            error
        );

        return [];
    }

    return (data ?? []) as PersonBalanceEntry[];
}
export async function getCurrentUserActivePeople(): Promise<
    Person[]
> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error(
            "Load active people error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return [];
    }

    return (data ?? []) as Person[];
}
export async function getPersonEntryByTransactionId(
    transactionId: string
): Promise<PersonBalanceEntry | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from("person_balance_entries")
        .select("*")
        .eq("transaction_id", transactionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Load transaction person entry error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return null;
    }

    if (!data) {
        return null;
    }

    return {
        ...data,
        balance_effect: Number(
            data.balance_effect
        ),
    } as PersonBalanceEntry;
}