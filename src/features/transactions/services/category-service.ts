import type { Category } from "@/features/transactions/types/transaction";
import { createClient } from "@/lib/supabase/server";

export async function ensureDefaultCategories(): Promise<void> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return;
    }

    const { count, error: countError } = await supabase
        .from("categories")
        .select("id", {
            count: "exact",
            head: true,
        })
        .eq("user_id", user.id);

    if (countError) {
        console.error("Count categories error:", countError);
        return;
    }

    if ((count ?? 0) > 0) {
        return;
    }

    const { error } = await supabase.rpc(
        "create_default_categories"
    );

    if (error) {
        console.error("Create default categories error:", error);
    }
}

export async function getCurrentUserCategories(): Promise<
    Category[]
> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    await ensureDefaultCategories();

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("transaction_type")
        .order("name");

    if (error) {
        console.error("Load categories error:", error);
        return [];
    }

    return (data ?? []) as Category[];
}