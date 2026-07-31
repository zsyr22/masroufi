"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Plus, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBill, payBill, updateBill, type BillState } from "@/features/bills/actions/bill-actions";
import type { AccountWithBalance } from "@/features/accounts/types/account";
import type { Category } from "@/features/transactions/types/transaction";
import type { Bill } from "@/features/bills/types/bill";

const initialState: BillState = {};
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function AddBillDialog({ accounts, categories }: { accounts: AccountWithBalance[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setSession((value) => value + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline"><Plus className="size-4" />Manage fixed bills</Button>} />
      <DialogContent>
        <AddBillDialogContent key={session} accounts={accounts} categories={categories} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddBillDialogContent({ accounts, categories, onDone }: { accounts: AccountWithBalance[]; categories: Category[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(createBill, initialState);
  const billsCategory = categories.find((category) => category.transaction_type === "expense" && category.name.toLowerCase() === "bills")
    ?? categories.find((category) => category.transaction_type === "expense");
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "");
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];

  return (
    <>
      <DialogHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500">
          <ReceiptText className="size-5" />
        </div>
        <DialogTitle>Add a fixed bill</DialogTitle>
        <DialogDescription>Add the bill once. After that, choose it from the payment dropdown every month.</DialogDescription>
      </DialogHeader>

      {state.success ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
            Fixed bill added successfully.
          </div>
          <Button type="button" className="w-full" onClick={onDone}><CheckCircle2 className="size-4" />Done</Button>
        </div>
      ) : (
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="categoryId" value={billsCategory?.id ?? ""} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bill-name">Bill name</Label>
            <Input id="bill-name" name="name" placeholder="DEWA" autoComplete="organization" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-provider">Provider</Label>
            <Input id="bill-provider" name="provider" placeholder="DEWA, du, e&..." autoComplete="organization" />
          </div>
          <div className="space-y-2">
            <Label>Default account</Label>
            <Select name="accountId" value={selectedAccountId} onValueChange={(value) => value && setSelectedAccountId(value)}>
              <SelectTrigger className="h-10 w-full"><span>{selectedAccount ? `${selectedAccount.name} · ${selectedAccount.currency}` : "Select account"}</span><SelectValue className="sr-only" /></SelectTrigger>
              <SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select name="frequency" defaultValue="monthly">
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-due-day">Due day</Label>
            <Input id="bill-due-day" name="dueDay" type="number" min="1" max="31" placeholder="28" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bill-expected-amount">Expected amount <span className="text-muted-foreground">optional</span></Label>
            <Input id="bill-expected-amount" name="expectedAmount" type="number" min="0" step="0.01" placeholder="Used only as a suggestion when recording payment" />
          </div>
          <input type="hidden" name="currency" value={selectedAccount?.currency ?? "AED"} />
          {state.message ? <p className="text-sm text-destructive sm:col-span-2">{state.message}</p> : null}
          <Button type="submit" className="sm:col-span-2" disabled={pending}>{pending ? "Saving..." : "Save fixed bill"}</Button>
        </form>
      )}
    </>
  );
}

export function RecordBillPaymentDialog({ bills, accounts }: { bills: Bill[]; accounts: AccountWithBalance[] }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setSession((value) => value + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button disabled={!bills.length}><ReceiptText className="size-4" />Record bill payment</Button>} />
      <DialogContent>
        <RecordBillPaymentContent key={session} bills={bills} accounts={accounts} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function RecordBillPaymentContent({ bills, accounts, onDone }: { bills: Bill[]; accounts: AccountWithBalance[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(payBill, initialState);
  const [selectedBillId, setSelectedBillId] = useState(bills[0]?.id ?? "");
  const selectedBill = bills.find((bill) => bill.id === selectedBillId) ?? bills[0];
  const defaultAccount = accounts.find((account) => account.id === selectedBill?.default_account_id) ?? accounts[0];
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccount?.id ?? "");
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? defaultAccount;

  function changeBill(value: string) {
    setSelectedBillId(value);
    const bill = bills.find((candidate) => candidate.id === value);
    const nextAccount = accounts.find((account) => account.id === bill?.default_account_id) ?? accounts[0];
    setSelectedAccountId(nextAccount?.id ?? "");
  }

  return (
    <>
      <DialogHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500"><WalletCards className="size-5" /></div>
        <DialogTitle>Record a bill payment</DialogTitle>
        <DialogDescription>Choose the fixed bill, enter the actual paid amount, and Masroufi will create the expense transaction automatically.</DialogDescription>
      </DialogHeader>

      {state.success ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
            Payment recorded. The amount was deducted from the selected account balance.
          </div>
          <Button type="button" className="w-full" onClick={onDone}><CheckCircle2 className="size-4" />Done</Button>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label>Fixed bill</Label>
            <Select name="billId" value={selectedBillId} onValueChange={(value) => value && changeBill(value)}>
              <SelectTrigger className="h-10 w-full"><span>{selectedBill ? `${selectedBill.name}${selectedBill.provider ? ` · ${selectedBill.provider}` : ""}` : "Choose DEWA, du, e&..."}</span><SelectValue className="sr-only" /></SelectTrigger>
              <SelectContent>{bills.map((bill) => <SelectItem key={bill.id} value={bill.id}>{bill.name}{bill.provider ? ` · ${bill.provider}` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Paid from</Label>
            <Select name="accountId" value={selectedAccountId} onValueChange={(value) => value && setSelectedAccountId(value)}>
              <SelectTrigger className="h-10 w-full"><span>{selectedAccount ? `${selectedAccount.name} · ${selectedAccount.currency}` : "Select account"}</span><SelectValue className="sr-only" /></SelectTrigger>
              <SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name} · {account.currency}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bill-payment-amount">Amount paid</Label>
              <Input key={`${selectedBillId}-${selectedBill?.expected_amount ?? ""}`} id="bill-payment-amount" name="amount" type="number" min="0.01" step="0.01" defaultValue={selectedBill?.expected_amount ?? ""} placeholder="685.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill-payment-date">Payment date</Label>
              <Input id="bill-payment-date" name="paidAt" type="date" defaultValue={today()} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-payment-notes">Notes <span className="text-muted-foreground">optional</span></Label>
            <Input id="bill-payment-notes" name="notes" placeholder="July DEWA bill" />
          </div>
          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
          <Button type="submit" className="w-full" disabled={pending || !selectedBillId}>{pending ? "Recording..." : "Record payment"}</Button>
        </form>
      )}
    </>
  );
}


export function EditBillDialog({ bill, accounts }: { bill: Bill; accounts: AccountWithBalance[] }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setSession((value) => value + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${bill.name}`} />} >
        <span className="text-base">✎</span>
      </DialogTrigger>
      <DialogContent>
        <EditBillDialogContent key={session} bill={bill} accounts={accounts} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditBillDialogContent({ bill, accounts, onDone }: { bill: Bill; accounts: AccountWithBalance[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(updateBill, initialState);
  const [selectedAccountId, setSelectedAccountId] = useState(bill.default_account_id ?? accounts[0]?.id ?? "");
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];

  return (
    <>
      <DialogHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500"><ReceiptText className="size-5" /></div>
        <DialogTitle>Edit fixed bill</DialogTitle>
        <DialogDescription>Update the reusable bill details. Previous payment history will stay unchanged.</DialogDescription>
      </DialogHeader>
      {state.success ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">Bill updated successfully.</div>
          <Button type="button" className="w-full" onClick={onDone}><CheckCircle2 className="size-4" />Done</Button>
        </div>
      ) : (
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="billId" value={bill.id} />
          <input type="hidden" name="categoryId" value={bill.category_id} />
          <div className="space-y-2 sm:col-span-2"><Label htmlFor={`edit-bill-name-${bill.id}`}>Bill name</Label><Input id={`edit-bill-name-${bill.id}`} name="name" defaultValue={bill.name} required /></div>
          <div className="space-y-2"><Label htmlFor={`edit-bill-provider-${bill.id}`}>Provider</Label><Input id={`edit-bill-provider-${bill.id}`} name="provider" defaultValue={bill.provider ?? ""} /></div>
          <div className="space-y-2"><Label>Default account</Label><Select name="accountId" value={selectedAccountId} onValueChange={(value) => value && setSelectedAccountId(value)}><SelectTrigger className="h-10 w-full"><span>{selectedAccount ? `${selectedAccount.name} · ${selectedAccount.currency}` : "Select account"}</span><SelectValue className="sr-only" /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name} · {account.currency}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Frequency</Label><Select name="frequency" defaultValue={bill.frequency}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor={`edit-bill-due-${bill.id}`}>Due day</Label><Input id={`edit-bill-due-${bill.id}`} name="dueDay" type="number" min="1" max="31" defaultValue={bill.due_day ?? ""} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor={`edit-bill-amount-${bill.id}`}>Expected amount <span className="text-muted-foreground">optional</span></Label><Input id={`edit-bill-amount-${bill.id}`} name="expectedAmount" type="number" min="0" step="0.01" defaultValue={bill.expected_amount ?? ""} /></div>
          <input type="hidden" name="currency" value={selectedAccount?.currency ?? bill.currency} />
          {state.message ? <p className="text-sm text-destructive sm:col-span-2">{state.message}</p> : null}
          <Button type="submit" className="sm:col-span-2" disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button>
        </form>
      )}
    </>
  );
}
