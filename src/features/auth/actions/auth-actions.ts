"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
    error?: string;
};

export async function login(
    _previousState: AuthActionState,
    formData: FormData
): Promise<AuthActionState> {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
        return {
            error: "Email and password are required.",
        };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            error: "Email or password is incorrect.",
        };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
}

export async function signUp(
    _previousState: AuthActionState,
    formData: FormData
): Promise<AuthActionState> {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(
        formData.get("confirmPassword") ?? ""
    );

    if (!email || !password || !confirmPassword) {
        return {
            error: "All fields are required.",
        };
    }

    if (password.length < 8) {
        return {
            error: "Password must contain at least 8 characters.",
        };
    }

    if (password !== confirmPassword) {
        return {
            error: "Passwords do not match.",
        };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return {
            error: error.message,
        };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
}

export async function logout() {
    const supabase = await createClient();

    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    redirect("/login");
}
export type UpdatePasswordActionState = {
    success?: boolean;
    message?: string;
    fieldErrors?: {
        password?: string[];
        confirmPassword?: string[];
    };
};

export async function updatePassword(
    _previousState: UpdatePasswordActionState,
    formData: FormData
): Promise<UpdatePasswordActionState> {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const fieldErrors: UpdatePasswordActionState["fieldErrors"] = {};

    if (password.length < 8) {
        fieldErrors.password = ["Password must contain at least 8 characters."];
    }

    if (password !== confirmPassword) {
        fieldErrors.confirmPassword = ["Passwords do not match."];
    }

    if (Object.keys(fieldErrors).length > 0) {
        return {
            message: "Please review the highlighted fields.",
            fieldErrors,
        };
    }

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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        return {
            message: error.message || "The password could not be updated.",
        };
    }

    return {
        success: true,
        message: "Password updated successfully.",
    };
}
