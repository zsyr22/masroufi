"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createPersonSchema } from "../schemas/person-schema";
import { createPersonEntrySchema } from "../schemas/person-entry-schema";

export type CreatePersonState = {
    success?: boolean;
    message?: string;
    fieldErrors?: {
        name?: string[];
        phone?: string[];
        notes?: string[];
    };
};

export async function createPerson(
    _: CreatePersonState,
    formData: FormData
): Promise<CreatePersonState> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            message: "Session expired.",
        };
    }

    const parsed =
        createPersonSchema.safeParse({
            name: formData.get("name"),
            phone:
                formData.get("phone") ||
                undefined,
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

    const { error } = await supabase
        .from("people")
        .insert({
            user_id: user.id,
            ...parsed.data,
        });

    if (error) {
        console.error("Create person error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        if (error.code === "23505") {
            return {
                message: "An active person with this name already exists.",
                fieldErrors: {
                    name: ["This name is already in use."],
                },
            };
        }

        return {
            message: "Unable to create person.",
        };
    }

    revalidatePath("/people");

    return {
        success: true,
    };
}
export type CreatePersonEntryState = {
    success?: boolean;
    message?: string;
    fieldErrors?: {
        entryType?: string[];
        amount?: string[];
        currency?: string[];
        entryDate?: string[];
        description?: string[];
    };
};

function getBalanceEffect(
    entryType:
        | "paid_for_person"
        | "person_paid_for_me"
        | "repayment_received"
        | "repayment_sent"
        | "adjustment",
    amount: number
): number {
    switch (entryType) {
        case "paid_for_person":
            return amount;

        case "person_paid_for_me":
            return -amount;

        case "repayment_received":
            return -amount;

        case "repayment_sent":
            return amount;

        case "adjustment":
            return amount;
    }
}

export async function createPersonEntry(
    _: CreatePersonEntryState,
    formData: FormData
): Promise<CreatePersonEntryState> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            message: "Session expired.",
        };
    }

    const parsed = createPersonEntrySchema.safeParse({
        personId: formData.get("personId"),
        entryType: formData.get("entryType"),
        amount: formData.get("amount"),
        currency: formData.get("currency"),
        entryDate: formData.get("entryDate"),
        description:
            formData.get("description") || undefined,
    });

    if (!parsed.success) {
        return {
            message:
                "Please review the highlighted fields.",
            fieldErrors:
                parsed.error.flatten().fieldErrors,
        };
    }

    const {
        personId,
        entryType,
        amount,
        currency,
        entryDate,
        description,
    } = parsed.data;

    const { data: person, error: personError } =
        await supabase
            .from("people")
            .select("id")
            .eq("id", personId)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

    if (personError || !person) {
        return {
            message:
                "This person could not be found.",
        };
    }

    const balanceEffect = getBalanceEffect(
        entryType,
        amount
    );

    const { error } = await supabase
        .from("person_balance_entries")
        .insert({
            user_id: user.id,
            person_id: personId,
            entry_type: entryType,
            balance_effect: balanceEffect,
            currency,
            entry_date: entryDate,
            description:
                description?.trim() || null,
        });

    if (error) {
        console.error("Create person entry error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return {
            message:
                "Unable to record balance activity.",
        };
    }

    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);
    revalidatePath("/dashboard");

    return {
        success: true,
    };
}
export type PersonMutationState = CreatePersonState;

export async function updatePerson(
    _: PersonMutationState,
    formData: FormData
): Promise<PersonMutationState> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { message: "Session expired." };
    }

    const personId = String(formData.get("personId") ?? "");
    const parsed = createPersonSchema.safeParse({
        name: formData.get("name"),
        phone: formData.get("phone") || undefined,
        notes: formData.get("notes") || undefined,
    });

    if (!personId) {
        return { message: "Person could not be identified." };
    }

    if (!parsed.success) {
        return {
            message: "Please review the highlighted fields.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const { error } = await supabase
        .from("people")
        .update({
            name: parsed.data.name,
            phone: parsed.data.phone?.trim() || null,
            notes: parsed.data.notes?.trim() || null,
        })
        .eq("id", personId)
        .eq("user_id", user.id);

    if (error) {
        if (error.code === "23505") {
            return {
                message: "An active person with this name already exists.",
                fieldErrors: { name: ["This name is already in use."] },
            };
        }

        console.error("Update person error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return { message: "Unable to update person." };
    }

    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);
    revalidatePath("/dashboard");

    return { success: true };
}

export async function deletePerson(
    _: PersonMutationState,
    formData: FormData
): Promise<PersonMutationState> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { message: "Session expired." };
    }

    const personId = String(formData.get("personId") ?? "");

    if (!personId) {
        return { message: "Person could not be identified." };
    }

    const { error } = await supabase
        .from("people")
        .delete()
        .eq("id", personId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Delete person error:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });

        return { message: "Unable to delete person." };
    }

    revalidatePath("/people");
    revalidatePath("/dashboard");

    return { success: true };
}
