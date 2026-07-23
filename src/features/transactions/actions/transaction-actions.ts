"use server";

import { revalidatePath } from "next/cache";

import { createTransactionSchema } from "@/features/transactions/schemas/transaction-schema";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type CreateTransactionState = {
    success?: boolean;
    message?: string;
    fieldErrors?: {
        type?: string[];
        amount?: string[];
        accountId?: string[];
        categoryId?: string[];
        payeeName?: string[];
        payeeType?: string[];
        transactionDate?: string[];
        notes?: string[];
    };
};

export async function createTransaction(
    _previousState: CreateTransactionState,
    formData: FormData
): Promise<CreateTransactionState> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message: "Your session expired. Please sign in again.",
        };
    }

    const parsed = createTransactionSchema.safeParse({
        type: formData.get("type"),
        amount: formData.get("amount"),
        accountId: formData.get("accountId"),
        categoryId: formData.get("categoryId"),
        payeeName: formData.get("payeeName") || undefined,
        payeeType: formData.get("payeeType"),
        transactionDate: formData.get("transactionDate"),
        notes: formData.get("notes") || undefined,
    });

    if (!parsed.success) {
        return {
            message: "Please review the highlighted fields.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const input = parsed.data;

    const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select("id, currency")
        .eq("id", input.accountId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

    if (accountError || !account) {
        return {
            message: "The selected account could not be found.",
        };
    }

    const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id, transaction_type")
        .eq("id", input.categoryId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

    if (categoryError || !category) {
        return {
            message: "The selected category could not be found.",
        };
    }

    if (category.transaction_type !== input.type) {
        return {
            message:
                "The selected category does not match the transaction type.",
        };
    }

    let payeeId: string | null = null;

    if (input.payeeName) {
        const normalizedPayeeName = input.payeeName.trim();

        const { data: existingPayee } = await supabase
            .from("payees")
            .select("id")
            .eq("user_id", user.id)
            .ilike("name", normalizedPayeeName)
            .eq("is_active", true)
            .maybeSingle();

        if (existingPayee) {
            payeeId = existingPayee.id;
        } else {
            const { data: newPayee, error: payeeError } = await supabase
                .from("payees")
                .insert({
                    user_id: user.id,
                    name: normalizedPayeeName,
                    type: input.payeeType,
                })
                .select("id")
                .single();

            if (payeeError || !newPayee) {
                console.error("Create payee error:", payeeError);

                return {
                    message: "The store or payee could not be created.",
                };
            }

            payeeId = newPayee.id;
        }
    }

    const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_id: account.id,
        category_id: category.id,
        payee_id: payeeId,
        type: input.type,
        amount: input.amount,
        currency: account.currency,
        transaction_date: input.transactionDate,
        notes: input.notes || null,
    });

    if (error) {
        console.error("Create transaction error:", error);

        return {
            message: "The transaction could not be saved.",
        };
    }

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    redirect("/transactions");
}

export type DeleteTransactionState = {
    success?: boolean;
    message?: string;
};

export async function deleteTransaction(
    transactionId: string
): Promise<DeleteTransactionState> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message: "Your session expired. Please sign in again.",
        };
    }

    const { data: transaction, error: transactionError } =
        await supabase
            .from("transactions")
            .select("id")
            .eq("id", transactionId)
            .eq("user_id", user.id)
            .maybeSingle();

    if (transactionError || !transaction) {
        return {
            message: "The transaction could not be found.",
        };
    }

    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Delete transaction error:", error);

        return {
            message: "The transaction could not be deleted.",
        };
    }

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return {
        success: true,
        message: "Transaction deleted successfully.",
    };
}