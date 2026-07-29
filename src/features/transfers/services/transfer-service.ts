import type {
    Transfer,
    TransferListItem,
} from "@/features/transfers/types/transfer";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserTransfers(): Promise<
    TransferListItem[]
> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from("transfers")
        .select(`
            *,
            from_account:accounts!transfers_from_account_id_fkey (
                id,
                name,
                currency
            ),
            to_account:accounts!transfers_to_account_id_fkey (
                id,
                name,
                currency
            )
        `)
        .eq("user_id", user.id)
        .order("transfer_date", {
            ascending: false,
        })
        .order("created_at", {
            ascending: false,
        });

    if (error) {
        console.error(
            "Load transfers error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return [];
    }

    return (
        data ?? []
    ) as TransferListItem[];
}

export async function getCurrentUserTransferById(
    transferId: string
): Promise<Transfer | null> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from("transfers")
        .select("*")
        .eq("id", transferId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Load transfer error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return null;
    }

    return data as Transfer | null;
}