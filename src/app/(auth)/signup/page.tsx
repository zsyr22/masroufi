import { redirect } from "next/navigation";

import { SignupForm } from "@/features/auth/components/signup-form";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                    Create your account
                </h1>

                <p className="text-sm text-muted-foreground">
                    Start tracking your finances in a few seconds.
                </p>
            </div>

            <SignupForm />
        </div>
    );
}