import type { Account } from "@/features/accounts/types/account";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserAccounts(): Promise<Account[]> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", {
            ascending: true,
        });

    if (error) {
        console.error("Load accounts error:", error);
        return [];
    }

    return (data ?? []) as Account[];
}