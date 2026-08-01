"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type RecoveryState = "checking" | "ready" | "invalid" | "success";

export function ResetPasswordForm() {
  const router = useRouter();
  const [recoveryState, setRecoveryState] =
    useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function initializeRecovery() {
      const supabase = createClient();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const type = hash.get("type");

      if (type === "recovery" && accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        window.history.replaceState({}, "", "/reset-password");

        if (cancelled) return;

        if (sessionError) {
          setRecoveryState("invalid");
          return;
        }

        setRecoveryState("ready");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      setRecoveryState(session ? "ready" : "invalid");
    }

    void initializeRecovery();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setRecoveryState("success");

    window.setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1200);
  }

  if (recoveryState === "checking") {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking your recovery link...
      </div>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          This recovery link is invalid or expired. Request a new one.
        </p>

        <Button className="w-full" render={<Link href="/forgot-password" />}>
          Request a new link
        </Button>
      </div>
    );
  }

  if (recoveryState === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-500">
        <CheckCircle2 className="size-5" />
        Password updated. Opening your dashboard...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirm password</Label>
        <Input
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
