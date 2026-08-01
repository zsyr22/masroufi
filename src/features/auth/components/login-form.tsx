"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
    login,
    type AuthActionState,
} from "@/features/auth/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function LoginForm() {
    const [state, formAction, isPending] = useActionState(
        login,
        initialState
    );

    return (
        <form action={formAction} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>

                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    required
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Password</Label>

                    <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                />
            </div>

            {state.error ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.error}
                </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                    href="/signup"
                    className="font-medium text-primary hover:underline"
                >
                    Create one
                </Link>
            </p>
        </form>
    );
}