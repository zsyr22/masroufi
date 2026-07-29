"use client";

import { useActionState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updatePassword,
  type UpdatePasswordActionState,
} from "@/features/auth/actions/auth-actions";
import { cn } from "@/lib/utils";

const initialState: UpdatePasswordActionState = {};

export function PasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
          {state.fieldErrors?.password?.[0] ? (
            <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
          {state.fieldErrors?.confirmPassword?.[0] ? (
            <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
          ) : null}
        </div>
      </div>

      {state.message ? (
        <p className={cn("rounded-lg px-3 py-2 text-sm", state.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}> 
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {isPending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
