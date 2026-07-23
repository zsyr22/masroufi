"use client";

import { useActionState, useEffect, useState } from "react";
import { Landmark, Plus } from "lucide-react";

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

export function AddAccountDialog() {
    const [open, setOpen] = useState(false);
    const [accountType, setAccountType] = useState("bank");
    const [currency, setCurrency] = useState("AED");
    const [included, setIncluded] = useState(true);

    const [state, formAction, isPending] = useActionState(
        createAccount,
        initialState
    );

    useEffect(() => {
        if (state.success) {
            setOpen(false);
            setAccountType("bank");
            setCurrency("AED");
            setIncluded(true);
        }
    }, [state.success]);

    function handleTypeChange(value: string | null) {
        if (!value) {
            return;
        }

        setAccountType(value);

        if (value === "savings") {
            setIncluded(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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

                    <DialogTitle>Add a new account</DialogTitle>

                    <DialogDescription>
                        Add a bank account, cash wallet, or savings balance.
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="space-y-5">
                    <input type="hidden" name="type" value={accountType} />
                    <input type="hidden" name="currency" value={currency} />
                    <input
                        type="hidden"
                        name="isIncludedInAvailableBalance"
                        value={String(included)}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="name">Account name</Label>

                        <Input
                            id="name"
                            name="name"
                            placeholder="Bank Name"
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
                                    <SelectItem value="bank">Bank account</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="savings">Savings</SelectItem>
                                </SelectContent>
                            </Select>
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
                                    <SelectItem value="AED">AED</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
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

                        <p className="text-xs text-muted-foreground">
                            Enter the amount currently available in this account.
                        </p>
                    </div>

                    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
                        <div className="space-y-1">
                            <Label htmlFor="included">
                                Include in available money
                            </Label>

                            <p className="text-xs leading-5 text-muted-foreground">
                                Turn this off for savings that should not be used for
                                daily spending.
                            </p>
                        </div>

                        <Switch
                            id="included"
                            checked={included}
                            onCheckedChange={setIncluded}
                        />
                    </div>

                    {state.message && !state.success ? (
                        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {state.message}
                        </p>
                    ) : null}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Creating..." : "Create account"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}