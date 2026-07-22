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