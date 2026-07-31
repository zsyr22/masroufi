"use client";

import { useState, useTransition } from "react";
import { Archive, Loader2 } from "lucide-react";
import { archiveBill } from "@/features/bills/actions/bill-actions";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DeleteBillButton({ billId, billName }: { billId: string; billName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleArchive() {
    setError(undefined);
    startTransition(async () => {
      const result = await archiveBill(billId);
      if (!result.success) { setError(result.message ?? "The bill could not be archived."); return; }
      setOpen(false);
    });
  }

  return <AlertDialog open={open} onOpenChange={setOpen}>
    <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Archive ${billName}`} className="text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600" />}><Archive className="size-4" /></AlertDialogTrigger>
    <AlertDialogContent size="sm">
      <AlertDialogHeader><AlertDialogTitle>Archive this fixed bill?</AlertDialogTitle><AlertDialogDescription>“{billName}” will no longer be available for new payments. Previous payment history and all linked transactions will remain untouched. You can restore it later from Archived bills.</AlertDialogDescription></AlertDialogHeader>
      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction type="button" onClick={handleArchive} disabled={pending}>{pending ? <><Loader2 className="size-4 animate-spin" />Archiving...</> : <><Archive className="size-4" />Archive bill</>}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
