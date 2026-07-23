"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Landmark, Plus } from "lucide-react";

import {
    createAccount,
    type CreateAccountState,
} from "@/features/accounts/actions/account-actions";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const initialState: CreateAccountState = {};

type AccountFormProps = {
    onCancel: () => void;
    onComplete: () => void;
};

function AccountForm({
    onCancel,
    onComplete,
}: AccountFormProps) {
    const [accountType, setAccountType] = useState("bank");
    const [currency, setCurrency] = useState("AED");
    const [included, setIncluded] = useState(true);

    const [state, formAction, isPending] = useActionState(
        createAccount,
        initialState
    );

    function handleTypeChange(value: string | null) {
        if (!value) {
            return;
        }

        setAccountType(value);
        setIncluded(value !== "savings");
    }

    if (state.success) {
        return (
            <div className="space-y-6 py-2">
                <div className="flex flex-col items-center text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CheckCircle2 className="size-7" />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold">
                        Account created
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                        The account was added successfully and is now included in
                        your financial overview.
                    </p>
                </div>

                <Button
                    type="button"
                    className="w-full"
                    onClick={onComplete}
                >
                    Done
                </Button>
            </div>
        );
    }

    return (
        <form action={formAction} className="space-y-5">
            <input
                type="hidden"
                name="type"
                value={accountType}
            />

            <input
                type="hidden"
                name="currency"
                value={currency}
            />

            <input
                type="hidden"
                name="isIncludedInAvailableBalance"
                value={String(included)}
            />

            <div className="space-y-2">
                <Label htmlFor="name">
                    Account name
                </Label>

                <Input
                    id="name"
                    name="name"
                    placeholder="Emirates NBD"
                    autoComplete="off"
                    required
                />

                {state.fieldErrors?.name?.[0] ? (
                    <p className="text-xs text-destructive">
                        {state.fieldErrors.name[0]}
                    </p>
                ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Account type</Label>

                    <Select
                        value={accountType}
                        onValueChange={handleTypeChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="bank">
                                Bank account
                            </SelectItem>

                            <SelectItem value="cash">
                                Cash
                            </SelectItem>

                            <SelectItem value="savings">
                                Savings
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {state.fieldErrors?.type?.[0] ? (
                        <p className="text-xs text-destructive">
                            {state.fieldErrors.type[0]}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label>Currency</Label>

                    <Select
                        value={currency}
                        onValueChange={(value) => {
                            if (value) {
                                setCurrency(value);
                            }
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="AED">
                                AED
                            </SelectItem>

                            <SelectItem value="USD">
                                USD
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {state.fieldErrors?.currency?.[0] ? (
                        <p className="text-xs text-destructive">
                            {state.fieldErrors.currency[0]}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="openingBalance">
                    Opening balance
                </Label>

                <div className="relative">
                    <Input
                        id="openingBalance"
                        name="openingBalance"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        defaultValue="0"
                        className="pr-16"
                        required
                    />

                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
                        {currency}
                    </span>
                </div>

                {state.fieldErrors?.openingBalance?.[0] ? (
                    <p className="text-xs text-destructive">
                        {state.fieldErrors.openingBalance[0]}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Enter the amount currently available in this account.
                    </p>
                )}
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                    <Label htmlFor="included">
                        Include in available money
                    </Label>

                    <p className="text-xs leading-5 text-muted-foreground">
                        Turn this off for savings that should not be used for daily
                        spending.
                    </p>
                </div>

                <Switch
                    id="included"
                    checked={included}
                    onCheckedChange={setIncluded}
                />
            </div>

            {state.message ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.message}
                </p>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isPending}
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    disabled={isPending}
                >
                    {isPending
                        ? "Creating..."
                        : "Create account"}
                </Button>
            </div>
        </form>
    );
}

export function AddAccountDialog() {
    const [open, setOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);

    function resetAndClose() {
        setOpen(false);
        setFormKey((currentKey) => currentKey + 1);
    }

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);

        if (!nextOpen) {
            setFormKey((currentKey) => currentKey + 1);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger
                render={
                    <Button>
                        <Plus className="size-4" />
                        Add account
                    </Button>
                }
            />

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Landmark className="size-5" />
                    </div>

                    <DialogTitle>
                        Add a new account
                    </DialogTitle>

                    <DialogDescription>
                        Add a bank account, cash wallet, or savings balance.
                    </DialogDescription>
                </DialogHeader>

                <AccountForm
                    key={formKey}
                    onCancel={resetAndClose}
                    onComplete={resetAndClose}
                />
            </DialogContent>
        </Dialog>
    );
}