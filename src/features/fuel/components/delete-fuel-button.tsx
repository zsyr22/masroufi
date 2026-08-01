"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteFuelEntry } from "@/features/fuel/actions/fuel-actions";

export function DeleteFuelButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function handleDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteFuelEntry(id);
      if (!result.success) { setError(result.message ?? "The fuel entry could not be deleted."); return; }
      setOpen(false); router.push("/fuel"); router.refresh();
    });
  }

  return <AlertDialog open={open} onOpenChange={setOpen}>
    <AlertDialogTrigger render={<Button type="button" variant="destructive" />}><Trash2 className="size-4" />Delete</AlertDialogTrigger>
    <AlertDialogContent size="sm"><AlertDialogHeader><AlertDialogTitle>Delete this fuel entry?</AlertDialogTitle><AlertDialogDescription>The fill-up and linked expense transaction will be permanently deleted.</AlertDialogDescription></AlertDialogHeader>
      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction type="button" onClick={handleDelete} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{pending ? <><Loader2 className="size-4 animate-spin" />Deleting...</> : <><Trash2 className="size-4" />Delete entry</>}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
