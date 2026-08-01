"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function initializeRecoverySession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = query.get("code");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.history.replaceState({}, "", "/reset-password");
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/reset-password");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setHasSession(Boolean(session));
        setCheckingSession(false);
      }
    }

    void initializeRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(updateError.message || "The password could not be updated.");
      return;
    }

    setSuccess(true);
    window.setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1200);
  }

  if (checkingSession) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Verifying your recovery link...
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-400">
          This recovery link is invalid or has expired. Request a fresh link and
          open the newest email only.
        </p>
        <Button render={<Link href="/forgot-password" />} className="w-full">
          Request a new recovery link
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-400">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-5" />
          <p className="font-medium">Password updated successfully.</p>
        </div>
        <p className="mt-2 text-sm text-emerald-400/80">
          Opening your dashboard...
        </p>
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
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          disabled={pending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
        <Input
          id="confirm-new-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          placeholder="Repeat your new password"
          minLength={8}
          disabled={pending}
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
