"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { transferSchema } from "@/features/transfers/schemas/transfer-schema";
import { createClient } from "@/lib/supabase/server";

export type TransferActionState = {
    success?: boolean;
    message?: string;

    fieldErrors?: {
        transferId?: string[];
        fromAccountId?: string[];
        toAccountId?: string[];
        amount?: string[];
        transferDate?: string[];
        notes?: string[];
    };
};

type ValidatedTransferAccounts = {
    fromAccount: {
        id: string;
        currency: string;
    };

    toAccount: {
        id: string;
        currency: string;
    };
};

function revalidateTransferPages() {
    revalidatePath("/transfers");
    revalidatePath("/transfers/new");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
}
async function validateTransferAccounts({
    supabase,
    userId,
    fromAccountId,
    toAccountId,
}: {
    supabase: Awaited<
        ReturnType<typeof createClient>
    >;
    userId: string;
    fromAccountId: string;
    toAccountId: string;
}): Promise<
    | {
        data: ValidatedTransferAccounts;
        error?: never;
    }
    | {
        data?: never;
        error: TransferActionState;
    }
> {
    const { data: accounts, error } =
        await supabase
            .from("accounts")
            .select("id, currency")
            .eq("user_id", userId)
            .eq("is_active", true)
            .in("id", [
                fromAccountId,
                toAccountId,
            ]);

    if (error) {
        console.error(
            "Validate transfer accounts error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return {
            error: {
                message:
                    "The selected accounts could not be validated.",
            },
        };
    }

    const fromAccount = (
        accounts ?? []
    ).find(
        (account) =>
            account.id === fromAccountId
    );

    const toAccount = (
        accounts ?? []
    ).find(
        (account) =>
            account.id === toAccountId
    );

    if (!fromAccount) {
        return {
            error: {
                message:
                    "The source account could not be found.",
                fieldErrors: {
                    fromAccountId: [
                        "Select a valid active account.",
                    ],
                },
            },
        };
    }

    if (!toAccount) {
        return {
            error: {
                message:
                    "The destination account could not be found.",
                fieldErrors: {
                    toAccountId: [
                        "Select a valid active account.",
                    ],
                },
            },
        };
    }

    if (
        fromAccount.id === toAccount.id
    ) {
        return {
            error: {
                message:
                    "The source and destination accounts must be different.",
                fieldErrors: {
                    toAccountId: [
                        "Choose a different account.",
                    ],
                },
            },
        };
    }

    if (
        fromAccount.currency !==
        toAccount.currency
    ) {
        return {
            error: {
                message:
                    "Transfers between different currencies are not supported yet.",
                fieldErrors: {
                    toAccountId: [
                        `Select an account using ${fromAccount.currency}.`,
                    ],
                },
            },
        };
    }

    return {
        data: {
            fromAccount,
            toAccount,
        },
    };
}

export async function createTransfer(
    _previousState: TransferActionState,
    formData: FormData
): Promise<TransferActionState> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message:
                "Your session expired. Please sign in again.",
        };
    }

    const parsed = transferSchema.safeParse({
        fromAccountId:
            formData.get("fromAccountId"),
        toAccountId:
            formData.get("toAccountId"),
        amount: formData.get("amount"),
        transferDate:
            formData.get("transferDate"),
        notes:
            formData.get("notes") ||
            undefined,
    });

    if (!parsed.success) {
        return {
            message:
                "Please review the highlighted fields.",
            fieldErrors:
                parsed.error.flatten()
                    .fieldErrors,
        };
    }

    const input = parsed.data;

    const accountsResult =
        await validateTransferAccounts({
            supabase,
            userId: user.id,
            fromAccountId:
                input.fromAccountId,
            toAccountId:
                input.toAccountId,
        });

    if (accountsResult.error) {
        return accountsResult.error;
    }

    const { fromAccount } =
        accountsResult.data;

    const { error } = await supabase
        .from("transfers")
        .insert({
            user_id: user.id,
            from_account_id:
                input.fromAccountId,
            to_account_id:
                input.toAccountId,
            amount: input.amount,
            currency:
                fromAccount.currency,
            transfer_date:
                input.transferDate,
            notes: input.notes || null,
        });

    if (error) {
        console.error(
            "Create transfer error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return {
            message:
                "The transfer could not be saved.",
        };
    }

    revalidateTransferPages();

    redirect("/transfers");
}

export async function updateTransfer(
    _previousState: TransferActionState,
    formData: FormData
): Promise<TransferActionState> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message:
                "Your session expired. Please sign in again.",
        };
    }

    const parsed = transferSchema.safeParse({
        transferId:
            formData.get("transferId"),
        fromAccountId:
            formData.get("fromAccountId"),
        toAccountId:
            formData.get("toAccountId"),
        amount: formData.get("amount"),
        transferDate:
            formData.get("transferDate"),
        notes:
            formData.get("notes") ||
            undefined,
    });

    if (!parsed.success) {
        return {
            message:
                "Please review the highlighted fields.",
            fieldErrors:
                parsed.error.flatten()
                    .fieldErrors,
        };
    }

    const input = parsed.data;

    if (!input.transferId) {
        return {
            message:
                "The transfer could not be found.",
        };
    }

    const {
        data: existingTransfer,
        error: existingTransferError,
    } = await supabase
        .from("transfers")
        .select("id")
        .eq("id", input.transferId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (
        existingTransferError ||
        !existingTransfer
    ) {
        return {
            message:
                "The transfer could not be found.",
        };
    }

    const accountsResult =
        await validateTransferAccounts({
            supabase,
            userId: user.id,
            fromAccountId:
                input.fromAccountId,
            toAccountId:
                input.toAccountId,
        });

    if (accountsResult.error) {
        return accountsResult.error;
    }

    const { fromAccount } =
        accountsResult.data;

    const { error } = await supabase
        .from("transfers")
        .update({
            from_account_id:
                input.fromAccountId,
            to_account_id:
                input.toAccountId,
            amount: input.amount,
            currency:
                fromAccount.currency,
            transfer_date:
                input.transferDate,
            notes: input.notes || null,
            updated_at:
                new Date().toISOString(),
        })
        .eq("id", input.transferId)
        .eq("user_id", user.id);

    if (error) {
        console.error(
            "Update transfer error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return {
            message:
                "The transfer could not be updated.",
        };
    }

    revalidateTransferPages();

    redirect("/transfers");
}

export async function deleteTransfer(
    transferId: string
): Promise<TransferActionState> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message:
                "Your session expired. Please sign in again.",
        };
    }

    const { error } = await supabase
        .from("transfers")
        .delete()
        .eq("id", transferId)
        .eq("user_id", user.id);

    if (error) {
        console.error(
            "Delete transfer error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return {
            message:
                "The transfer could not be deleted.",
        };
    }

    revalidateTransferPages();

    return {
        success: true,
        message:
            "Transfer deleted successfully.",
    };
}