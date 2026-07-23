"use server";

import { revalidatePath } from "next/cache";

import { createCategorySchema } from "@/features/categories/schemas/category-schema";
import { createClient } from "@/lib/supabase/server";

export type CategoryActionState = {
    success?: boolean;
    message?: string;
    fieldErrors?: {
        name?: string[];
        transactionType?: string[];
    };
};

async function getAuthenticatedUser() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            supabase,
            user: null,
        };
    }

    return {
        supabase,
        user,
    };
}

export async function createCategory(
    _previousState: CategoryActionState,
    formData: FormData
): Promise<CategoryActionState> {
    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
        return {
            message: "Your session expired. Please sign in again.",
        };
    }

    const parsed = createCategorySchema.safeParse({
        name: formData.get("name"),
        transactionType: formData.get("transactionType"),
    });

    if (!parsed.success) {
        return {
            message: "Please review the form.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const { error } = await supabase.from("categories").insert({
        user_id: user.id,
        name: parsed.data.name,
        transaction_type: parsed.data.transactionType,
        is_system: false,
        is_active: true,
    });

    if (error) {
        if (error.code === "23505") {
            return {
                message:
                    "An active category with this name and type already exists.",
            };
        }

        console.error("Create category error:", error);

        return {
            message: "The category could not be created.",
        };
    }

    revalidatePath("/categories");
    revalidatePath("/transactions/new");

    return {
        success: true,
        message: "Category created successfully.",
    };
}

export async function deactivateCategory(
    categoryId: string
): Promise<void> {
    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
        return;
    }

    const { error } = await supabase
        .from("categories")
        .update({
            is_active: false,
        })
        .eq("id", categoryId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Deactivate category error:", error);
        return;
    }

    revalidatePath("/categories");
    revalidatePath("/transactions/new");
}