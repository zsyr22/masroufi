"use server";

import { revalidatePath } from "next/cache";

import {
    createAccountSchema,
    updateAccountSchema,
} from "@/features/accounts/schemas/account-schema";
import { createClient } from "@/lib/supabase/server";

export type AccountActionState = {
    success?: boolean;
    message?: string;
    fieldErrors?: {
        accountId?: string[];
        name?: string[];
        type?: string[];
        currency?: string[];
        openingBalance?: string[];
        isIncludedInAvailableBalance?: string[];
    };
};

export type CreateAccountState =
    AccountActionState;

function revalidateAccountPages() {
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/transactions/new");
}

export async function createAccount(
    _previousState: AccountActionState,
    formData: FormData
): Promise<AccountActionState> {
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

    const parsed =
        createAccountSchema.safeParse({
            name: formData.get("name"),
            type: formData.get("type"),
            currency: formData.get("currency"),
            openingBalance:
                formData.get("openingBalance"),
            isIncludedInAvailableBalance:
                formData.get(
                    "isIncludedInAvailableBalance"
                ) === "true",
        });

    if (!parsed.success) {
        return {
            message:
                "Please review the highlighted fields.",
            fieldErrors:
                parsed.error.flatten().fieldErrors,
        };
    }

    const { error } = await supabase
        .from("accounts")
        .insert({
            user_id: user.id,
            name: parsed.data.name,
            type: parsed.data.type,
            currency: parsed.data.currency,
            opening_balance:
                parsed.data.openingBalance,
            is_included_in_available_balance:
                parsed.data
                    .isIncludedInAvailableBalance,
        });

    if (error) {
        if (error.code === "23505") {
            return {
                message:
                    "You already have an active account with this name and currency.",
            };
        }

        console.error("Create account error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return {
            message:
                "We could not create the account. Please try again.",
        };
    }

    revalidateAccountPages();

    return {
        success: true,
        message:
            "Account created successfully.",
    };
}

export async function updateAccount(
    _previousState: AccountActionState,
    formData: FormData
): Promise<AccountActionState> {
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

    const parsed =
        updateAccountSchema.safeParse({
            accountId:
                formData.get("accountId"),
            name: formData.get("name"),
            type: formData.get("type"),
            currency: formData.get("currency"),
            openingBalance:
                formData.get("openingBalance"),
            isIncludedInAvailableBalance:
                formData.get(
                    "isIncludedInAvailableBalance"
                ) === "true",
        });

    if (!parsed.success) {
        return {
            message:
                "Please review the highlighted fields.",
            fieldErrors:
                parsed.error.flatten().fieldErrors,
        };
    }

    const input = parsed.data;

    const {
        data: existingAccount,
        error: accountError,
    } = await supabase
        .from("accounts")
        .select("id, currency")
        .eq("id", input.accountId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (accountError || !existingAccount) {
        return {
            message:
                "The account could not be found.",
        };
    }

    const {
        count: transactionCount,
        error: countError,
    } = await supabase
        .from("transactions")
        .select("id", {
            count: "exact",
            head: true,
        })
        .eq("account_id", input.accountId)
        .eq("user_id", user.id);

    if (countError) {
        return {
            message:
                "The account transactions could not be checked.",
        };
    }

    const hasTransactions =
        (transactionCount ?? 0) > 0;

    if (
        hasTransactions &&
        input.currency !==
        existingAccount.currency
    ) {
        return {
            message:
                "The currency cannot be changed because this account already has transactions.",
            fieldErrors: {
                currency: [
                    "Currency is locked for accounts with transactions.",
                ],
            },
        };
    }

    const { error } = await supabase
        .from("accounts")
        .update({
            name: input.name,
            type: input.type,
            currency: input.currency,
            opening_balance:
                input.openingBalance,
            is_included_in_available_balance:
                input
                    .isIncludedInAvailableBalance,
        })
        .eq("id", input.accountId)
        .eq("user_id", user.id);

    if (error) {
        if (error.code === "23505") {
            return {
                message:
                    "You already have another active account with this name and currency.",
            };
        }

        console.error("Update account error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return {
            message:
                "The account could not be updated.",
        };
    }

    revalidateAccountPages();

    return {
        success: true,
        message:
            "Account updated successfully.",
    };
}

export async function archiveAccount(
    accountId: string
): Promise<AccountActionState> {
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
        .from("accounts")
        .update({
            is_active: false,
        })
        .eq("id", accountId)
        .eq("user_id", user.id)
        .eq("is_active", true);

    if (error) {
        console.error("Archive account error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return {
            message:
                "The account could not be archived.",
        };
    }

    revalidateAccountPages();

    return {
        success: true,
        message:
            "Account archived successfully.",
    };
}

export async function deleteAccount(
    accountId: string
): Promise<AccountActionState> {
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

    const {
        data: account,
        error: accountError,
    } = await supabase
        .from("accounts")
        .select("id")
        .eq("id", accountId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (accountError || !account) {
        return {
            message:
                "The account could not be found.",
        };
    }

    const {
        count: transactionCount,
        error: countError,
    } = await supabase
        .from("transactions")
        .select("id", {
            count: "exact",
            head: true,
        })
        .eq("account_id", accountId)
        .eq("user_id", user.id);

    if (countError) {
        return {
            message:
                "The account transactions could not be checked.",
        };
    }

    if ((transactionCount ?? 0) > 0) {
        return {
            message:
                "This account has transactions and cannot be deleted. Archive it instead.",
        };
    }

    const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Delete account error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return {
            message:
                "The account could not be deleted.",
        };
    }

    revalidateAccountPages();

    return {
        success: true,
        message:
            "Account deleted successfully.",
    };
}
export async function restoreAccount(
    accountId: string
): Promise<AccountActionState> {
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

    const {
        data: account,
        error: accountError,
    } = await supabase
        .from("accounts")
        .select("id, name, currency")
        .eq("id", accountId)
        .eq("user_id", user.id)
        .eq("is_active", false)
        .maybeSingle();

    if (accountError || !account) {
        return {
            message:
                "The archived account could not be found.",
        };
    }

    const {
        data: duplicateAccount,
        error: duplicateError,
    } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .ilike("name", account.name)
        .eq("currency", account.currency)
        .maybeSingle();

    if (duplicateError) {
        return {
            message:
                "The account could not be checked before restoring.",
        };
    }

    if (duplicateAccount) {
        return {
            message:
                "An active account with the same name and currency already exists. Rename that account first.",
        };
    }

    const { error } = await supabase
        .from("accounts")
        .update({
            is_active: true,
        })
        .eq("id", accountId)
        .eq("user_id", user.id)
        .eq("is_active", false);

    if (error) {
        console.error("Restore account error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return {
            message:
                "The account could not be restored.",
        };
    }

    revalidateAccountPages();

    return {
        success: true,
        message:
            "Account restored successfully.",
    };
}