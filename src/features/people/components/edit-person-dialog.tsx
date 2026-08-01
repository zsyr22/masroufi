"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updatePerson,
  type PersonMutationState,
} from "@/features/people/actions/people-actions";
import type { Person } from "@/features/people/types/person";

const initialState: PersonMutationState = {};

type Props = {
  person: Pick<Person, "id" | "name" | "phone" | "notes">;
  size?: "sm" | "default";
};

export function EditPersonDialog({ person, size = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updatePerson,
    initialState
  );

  useEffect(() => {
    if (!state.success) return;
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={(value) => !pending && setOpen(value)}>
      <DialogTrigger
        render={
          <Button variant="outline" size={size === "sm" ? "sm" : "default"}>
            <Pencil className="size-4" />
            Edit
          </Button>
        }
      />

      <DialogContent className="border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/8 via-background to-background">
        <DialogHeader>
          <DialogTitle>Edit person</DialogTitle>
          <DialogDescription>
            Correct the name, phone number, or notes without affecting the balance history.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="personId" value={person.id} />

          <div className="space-y-2">
            <Label htmlFor={`person-name-${person.id}`}>Name</Label>
            <Input
              id={`person-name-${person.id}`}
              name="name"
              defaultValue={person.name}
              disabled={pending}
              autoFocus
            />
            {state.fieldErrors?.name?.[0] ? (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`person-phone-${person.id}`}>Phone</Label>
            <Input
              id={`person-phone-${person.id}`}
              name="phone"
              type="tel"
              defaultValue={person.phone ?? ""}
              placeholder="+971..."
              disabled={pending}
            />
            {state.fieldErrors?.phone?.[0] ? (
              <p className="text-sm text-destructive">{state.fieldErrors.phone[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`person-notes-${person.id}`}>Notes</Label>
            <Textarea
              id={`person-notes-${person.id}`}
              name="notes"
              defaultValue={person.notes ?? ""}
              placeholder="Add a short note..."
              disabled={pending}
            />
            {state.fieldErrors?.notes?.[0] ? (
              <p className="text-sm text-destructive">{state.fieldErrors.notes[0]}</p>
            ) : null}
          </div>

          {state.message ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
