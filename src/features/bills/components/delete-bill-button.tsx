"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteBill } from "@/features/bills/actions/bill-actions";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DeleteBillButton({ billId, billName }: { billId: string; billName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteBill(billId);
      if (!result.success) { setError(result.message ?? "The bill could not be deleted."); return; }
      setOpen(false);
    });
  }

  return <AlertDialog open={open} onOpenChange={setOpen}>
    <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${billName}`} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" />}><Trash2 className="size-4" /></AlertDialogTrigger>
    <AlertDialogContent size="sm">
      <AlertDialogHeader><AlertDialogTitle>Delete this fixed bill?</AlertDialogTitle><AlertDialogDescription>“{billName}” will disappear from future bill payments. Previous payment history and transactions will remain available.</AlertDialogDescription></AlertDialogHeader>
      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction type="button" onClick={handleDelete} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{pending ? <><Loader2 className="size-4 animate-spin" />Deleting...</> : <><Trash2 className="size-4" />Delete bill</>}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
