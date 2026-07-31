"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { AccountWithBalance } from "@/features/accounts/types/account";
import {
    deleteSubscriptionPayment,
    recordSubscriptionPayment,
    updateSubscriptionPayment,
    type SubscriptionActionState,
} from "@/features/subscriptions/actions/subscription-actions";
import type { SubscriptionPayment } from "@/features/subscriptions/types/subscription";

const initialState: SubscriptionActionState = {};

function today() {
    return new Date().toISOString().slice(0, 10);
}

export function RecordSubscriptionPaymentDialog({
    subscriptionId,
    subscriptionName,
    expectedAmount,
    currency,
    defaultAccountId,
    accounts,
    disabled,
}: {
    subscriptionId: string;
    subscriptionName: string;
    expectedAmount: number;
    currency: string;
    defaultAccountId: string | null;
    accounts: AccountWithBalance[];
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState(0);

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (nextOpen) setSession((value) => value + 1);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button type="button" size="sm" disabled={disabled} />
                }
            >
                <Plus className="size-4" />
                Record payment
            </DialogTrigger>
            <DialogContent>
                <PaymentForm
                    key={session}
                    mode="create"
                    subscriptionId={subscriptionId}
                    subscriptionName={subscriptionName}
                    expectedAmount={expectedAmount}
                    currency={currency}
                    defaultAccountId={defaultAccountId}
                    accounts={accounts}
                    onDone={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

export function EditSubscriptionPaymentDialog({
    payment,
    subscriptionName,
    currency,
    accounts,
}: {
    payment: SubscriptionPayment;
    subscriptionName: string;
    currency: string;
    accounts: AccountWithBalance[];
}) {
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState(0);

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (nextOpen) setSession((value) => value + 1);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${subscriptionName} payment`}
                    />
                }
            >
                <Pencil className="size-4" />
            </DialogTrigger>
            <DialogContent>
                <PaymentForm
                    key={session}
                    mode="edit"
                    payment={payment}
                    subscriptionName={subscriptionName}
                    expectedAmount={Number(payment.amount)}
                    currency={currency}
                    defaultAccountId={payment.transaction?.account_id ?? null}
                    accounts={accounts}
                    onDone={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function PaymentForm({
    mode,
    subscriptionId,
    payment,
    subscriptionName,
    expectedAmount,
    currency,
    defaultAccountId,
    accounts,
    onDone,
}: {
    mode: "create" | "edit";
    subscriptionId?: string;
    payment?: SubscriptionPayment;
    subscriptionName: string;
    expectedAmount: number;
    currency: string;
    defaultAccountId: string | null;
    accounts: AccountWithBalance[];
    onDone: () => void;
}) {
    const action = mode === "create" ? recordSubscriptionPayment : updateSubscriptionPayment;
    const [state, formAction, pending] = useActionState(action, initialState);
    const initialAccountId = defaultAccountId ?? accounts[0]?.id ?? "";
    const [accountId, setAccountId] = useState(initialAccountId);
    const selectedAccount = accounts.find((account) => account.id === accountId);

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {mode === "create" ? "Record subscription payment" : "Edit subscription payment"}
                </DialogTitle>
                <DialogDescription>
                    The amount below is what you actually paid. Changing the subscription price later will not rewrite this history.
                </DialogDescription>
            </DialogHeader>

            {state.success ? (
                <div className="space-y-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
                        {state.message}
                    </div>
                    <Button type="button" className="w-full" onClick={onDone}>
                        <CheckCircle2 className="size-4" />
                        Done
                    </Button>
                </div>
            ) : (
                <form action={formAction} className="space-y-4">
                    {mode === "create" ? (
                        <input type="hidden" name="subscriptionId" value={subscriptionId} />
                    ) : (
                        <input type="hidden" name="paymentId" value={payment?.id} />
                    )}

                    <div className="rounded-xl border bg-muted/20 p-4">
                        <p className="text-sm font-medium">{subscriptionName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Current expected price: {expectedAmount.toFixed(2)} {currency}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Paid from</Label>
                        <Select name="accountId" value={accountId} onValueChange={(value) => value && setAccountId(value)}>
                            <SelectTrigger className="h-10 w-full">
                                <span>{selectedAccount ? `${selectedAccount.name} · ${selectedAccount.currency}` : "Select account"}</span>
                                <SelectValue className="sr-only" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.name} · {account.currency}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`subscription-payment-amount-${payment?.id ?? subscriptionId}`}>Amount paid</Label>
                            <Input
                                id={`subscription-payment-amount-${payment?.id ?? subscriptionId}`}
                                name="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                defaultValue={mode === "edit" ? Number(payment?.amount) : expectedAmount}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`subscription-payment-date-${payment?.id ?? subscriptionId}`}>Payment date</Label>
                            <Input
                                id={`subscription-payment-date-${payment?.id ?? subscriptionId}`}
                                name="paidAt"
                                type="date"
                                defaultValue={payment?.paid_at ?? today()}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`subscription-payment-notes-${payment?.id ?? subscriptionId}`}>
                            Notes <span className="text-muted-foreground">optional</span>
                        </Label>
                        <Input
                            id={`subscription-payment-notes-${payment?.id ?? subscriptionId}`}
                            name="notes"
                            defaultValue={payment?.notes ?? ""}
                        />
                    </div>

                    {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

                    <Button type="submit" className="w-full" disabled={pending || !accountId}>
                        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                        {pending ? "Saving..." : mode === "create" ? "Record payment" : "Save changes"}
                    </Button>
                </form>
            )}
        </>
    );
}

export function DeleteSubscriptionPaymentButton({
    payment,
    subscriptionName,
}: {
    payment: SubscriptionPayment;
    subscriptionName: string;
}) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string>();
    const [pending, startTransition] = useTransition();

    function handleDelete() {
        setError(undefined);
        startTransition(async () => {
            const result = await deleteSubscriptionPayment(payment.id);
            if (!result.success) {
                setError(result.message ?? "Could not delete the payment.");
                return;
            }
            setOpen(false);
        });
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
                render={
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${subscriptionName} payment`}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    />
                }
            >
                <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this subscription payment?</AlertDialogTitle>
                    <AlertDialogDescription>
                        The payment and its linked transaction will be deleted. Account balances, dashboard, reports, and subscription progress will be recalculated.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        type="button"
                        onClick={handleDelete}
                        disabled={pending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        {pending ? "Deleting..." : "Delete payment"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
