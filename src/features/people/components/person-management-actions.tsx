"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  deletePerson,
  updatePerson,
  type PersonMutationState,
} from "@/features/people/actions/people-actions";
import type { Person } from "@/features/people/types/person";

const updateInitialState: PersonMutationState = {};
const deleteInitialState: PersonMutationState = {};

export function PersonManagementActions({
  person,
  entriesCount,
}: {
  person: Person;
  entriesCount: number;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(person.name);
  const [phone, setPhone] = useState(person.phone ?? "");
  const [notes, setNotes] = useState(person.notes ?? "");
  const [updateState, updateAction, updatePending] = useActionState(
    updatePerson,
    updateInitialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePerson,
    deleteInitialState
  );

  useEffect(() => {
    if (editOpen) {
      setName(person.name);
      setPhone(person.phone ?? "");
      setNotes(person.notes ?? "");
    }
  }, [editOpen, person.name, person.phone, person.notes]);

  useEffect(() => {
    if (updateState.success) setEditOpen(false);
  }, [updateState.success]);

  useEffect(() => {
    if (deleteState.success) router.push("/people");
  }, [deleteState.success, router]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={editOpen} onOpenChange={(open) => !updatePending && setEditOpen(open)}>
        <DialogTrigger render={<Button variant="outline"><Pencil className="size-4" />Edit</Button>} />
        <DialogContent className="border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-500/10 via-popover to-popover shadow-[0_24px_80px_rgba(217,70,239,0.12)]">
          <DialogHeader>
            <DialogTitle>Edit person</DialogTitle>
            <DialogDescription>Correct the name, phone number, or notes.</DialogDescription>
          </DialogHeader>
          <form action={updateAction} className="space-y-5">
            <input type="hidden" name="personId" value={person.id} />
            <div className="space-y-2">
              <Label htmlFor="edit-person-name">Name</Label>
              <Input id="edit-person-name" name="name" value={name} onChange={(event) => setName(event.target.value)} disabled={updatePending} />
              {updateState.fieldErrors?.name?.[0] ? <p className="text-sm text-destructive">{updateState.fieldErrors.name[0]}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-person-phone">Phone <span className="text-muted-foreground">optional</span></Label>
              <Input id="edit-person-phone" name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={updatePending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-person-notes">Notes <span className="text-muted-foreground">optional</span></Label>
              <Textarea id="edit-person-notes" name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} disabled={updatePending} />
            </div>
            {updateState.message ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{updateState.message}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={updatePending}>Cancel</Button>
              <Button type="submit" disabled={updatePending}>{updatePending ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive"><Trash2 className="size-4" />{entriesCount > 0 ? "Archive" : "Delete"}</Button>} />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2 /></AlertDialogMedia>
            <AlertDialogTitle>{entriesCount > 0 ? "Archive this person?" : "Delete this person?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {entriesCount > 0
                ? "This person has financial history, so Masroufi will hide them without deleting their ledger."
                : "This person has no financial history and will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteState.message ? <p className="text-sm text-destructive">{deleteState.message}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <form action={deleteAction}>
              <input type="hidden" name="personId" value={person.id} />
              <AlertDialogAction type="submit" variant="destructive" disabled={deletePending}>
                {deletePending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {entriesCount > 0 ? "Archive person" : "Delete permanently"}
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
