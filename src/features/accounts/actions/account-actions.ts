"use server";

import { revalidatePath } from "next/cache";

import { createAccountSchema } from "@/features/accounts/schemas/account-schema";
import { createClient } from "@/lib/supabase/server";

export type CreateAccountState = {
    success?: boolean;
    message?: string;
    fieldErrors?: {
        name?: string[];
        type?: string[];
        currency?: string[];
        openingBalance?: string[];
        isIncludedInAvailableBalance?: string[];
    };
};

export async function createAccount(
    _previousState: CreateAccountState,
    formData: FormData
): Promise<CreateAccountState> {
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

    const parsed = createAccountSchema.safeParse({
        name: formData.get("name"),
        type: formData.get("type"),
        currency: formData.get("currency"),
        openingBalance: formData.get("openingBalance"),
        isIncludedInAvailableBalance:
            formData.get("isIncludedInAvailableBalance") === "true",
    });

    if (!parsed.success) {
        return {
            message: "Please review the highlighted fields.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const { error } = await supabase.from("accounts").insert({
        user_id: user.id,
        name: parsed.data.name,
        type: parsed.data.type,
        currency: parsed.data.currency,
        opening_balance: parsed.data.openingBalance,
        is_included_in_available_balance:
            parsed.data.isIncludedInAvailableBalance,
    });

    if (error) {
        if (error.code === "23505") {
            return {
                message:
                    "You already have an active account with this name and currency.",
            };
        }

        console.error("Create account error:", error);

        return {
            message: "We could not create the account. Please try again.",
        };
    }

    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return {
        success: true,
        message: "Account created successfully.",
    };
}