import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { AuthRecoveryHandler } from "@/features/auth/components/auth-recovery-handler";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-8">
            <AuthRecoveryHandler />
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                    Welcome back
                </h1>

                <p className="text-sm text-muted-foreground">
                    Sign in to continue to Masroufi.
                </p>
            </div>

            <LoginForm />
        </div>
    );
}