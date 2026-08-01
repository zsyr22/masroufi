"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);
    setError(undefined);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

    setPending(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage(
      "A password recovery link has been sent. Open the newest email from Supabase."
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recovery-email">Email</Label>
        <Input
          id="recovery-email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      {message ? (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Sending..." : "Send recovery link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
