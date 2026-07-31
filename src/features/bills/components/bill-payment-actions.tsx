"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteBillPayment, updateBillPayment, type BillState } from "@/features/bills/actions/bill-actions";
import type { AccountWithBalance } from "@/features/accounts/types/account";
import type { BillPaymentHistoryItem } from "@/features/bills/types/bill";

const initialState: BillState = {};

export function EditBillPaymentDialog({ payment, accounts }: { payment: BillPaymentHistoryItem; accounts: AccountWithBalance[] }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setSession((value) => value + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${payment.bill?.name ?? "bill payment"}`} />}>
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <EditBillPaymentContent key={session} payment={payment} accounts={accounts} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditBillPaymentContent({ payment, accounts, onDone }: { payment: BillPaymentHistoryItem; accounts: AccountWithBalance[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateBillPayment, initialState);
  const initialAccountId = payment.transaction?.account_id ?? accounts[0]?.id ?? "";
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId);
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit bill payment</DialogTitle>
        <DialogDescription>Changes here also update the linked transaction, account balance, dashboard, and reports.</DialogDescription>
      </DialogHeader>
      {state.success ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">Bill payment updated successfully.</div>
          <Button type="button" className="w-full" onClick={onDone}><CheckCircle2 className="size-4" />Done</Button>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="paymentId" value={payment.id} />
          <div className="space-y-2">
            <Label>Bill</Label>
            <Input value={payment.bill?.name ?? "Bill payment"} disabled />
          </div>
          <div className="space-y-2">
            <Label>Paid from</Label>
            <Select name="accountId" value={selectedAccountId} onValueChange={(value) => value && setSelectedAccountId(value)}>
              <SelectTrigger className="h-10 w-full"><span>{selectedAccount ? `${selectedAccount.name} · ${selectedAccount.currency}` : "Select account"}</span><SelectValue className="sr-only" /></SelectTrigger>
              <SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name} · {account.currency}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={`payment-amount-${payment.id}`}>Amount paid</Label><Input id={`payment-amount-${payment.id}`} name="amount" type="number" min="0.01" step="0.01" defaultValue={Number(payment.amount)} required /></div>
            <div className="space-y-2"><Label htmlFor={`payment-date-${payment.id}`}>Payment date</Label><Input id={`payment-date-${payment.id}`} name="paidAt" type="date" defaultValue={payment.paid_at} required /></div>
          </div>
          <div className="space-y-2"><Label htmlFor={`payment-notes-${payment.id}`}>Notes <span className="text-muted-foreground">optional</span></Label><Input id={`payment-notes-${payment.id}`} name="notes" defaultValue={payment.notes ?? ""} /></div>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <Button type="submit" className="w-full" disabled={pending || !selectedAccountId}>{pending ? "Saving..." : "Save changes"}</Button>
        </form>
      )}
    </>
  );
}

export function DeleteBillPaymentButton({ payment }: { payment: BillPaymentHistoryItem }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteBillPayment(payment.id);
      if (!result.success) {
        setError(result.message ?? "The bill payment could not be deleted.");
        return;
      }
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${payment.bill?.name ?? "bill payment"}`} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" />}>
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this bill payment?</AlertDialogTitle>
          <AlertDialogDescription>The payment and its linked expense transaction will be permanently deleted. Your account balance, dashboard, and reports will be recalculated.</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={handleDelete} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {pending ? <><Loader2 className="size-4 animate-spin" />Deleting...</> : <><Trash2 className="size-4" />Delete payment</>}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
