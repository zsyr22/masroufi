"use client";

import {
    useActionState,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import {
    ArrowDown,
    ArrowRight,
    Loader2,
} from "lucide-react";

import {
    Button,
    buttonVariants,
} from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { AccountWithBalance } from "@/features/accounts/types/account";
import {
    createTransfer,
    updateTransfer,
    type TransferActionState,
} from "@/features/transfers/actions/transfer-actions";

import { cn } from "@/lib/utils";

export type TransferFormInitialValues = {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    transferDate: string;
    notes: string;
};

type TransferFormProps = {
    accounts: AccountWithBalance[];
    mode?: "create" | "edit";
    initialValues?: TransferFormInitialValues;
};

const initialState: TransferActionState = {};

function getTodayDate(): string {
    const date = new Date();

    const timezoneOffset =
        date.getTimezoneOffset() * 60_000;

    return new Date(
        date.getTime() - timezoneOffset
    )
        .toISOString()
        .slice(0, 10);
}

function formatBalance(
    amount: number,
    currency: string
): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export function TransferForm({
    accounts,
    mode = "create",
    initialValues,
}: TransferFormProps) {
    const isEditMode = mode === "edit";

    const initialFromAccountId =
        initialValues?.fromAccountId ??
        accounts[0]?.id ??
        "";

    const [fromAccountId, setFromAccountId] =
        useState(initialFromAccountId);

    const selectedFromAccount = accounts.find(
        (account) =>
            account.id === fromAccountId
    );

    const compatibleDestinationAccounts =
        useMemo(() => {
            if (!selectedFromAccount) {
                return [];
            }

            return accounts.filter(
                (account) =>
                    account.id !==
                    selectedFromAccount.id &&
                    account.currency ===
                    selectedFromAccount.currency
            );
        }, [
            accounts,
            selectedFromAccount,
        ]);

    const initialToAccountIsValid =
        compatibleDestinationAccounts.some(
            (account) =>
                account.id ===
                initialValues?.toAccountId
        );

    const [toAccountId, setToAccountId] =
        useState(
            initialToAccountIsValid
                ? initialValues?.toAccountId ??
                ""
                : compatibleDestinationAccounts[0]
                    ?.id ?? ""
        );

    const selectedToAccount = accounts.find(
        (account) =>
            account.id === toAccountId
    );

    const transferAction = isEditMode
        ? updateTransfer
        : createTransfer;

    const [state, formAction, isPending] =
        useActionState(
            transferAction,
            initialState
        );

    const fromAccountItems = accounts.map(
        (account) => ({
            value: account.id,
            label: `${account.name} · ${account.currency}`,
        })
    );

    const toAccountItems =
        compatibleDestinationAccounts.map(
            (account) => ({
                value: account.id,
                label: `${account.name} · ${account.currency}`,
            })
        );

    function changeFromAccount(
        value: string
    ) {
        const nextAccount = accounts.find(
            (account) =>
                account.id === value
        );

        setFromAccountId(value);

        if (!nextAccount) {
            setToAccountId("");
            return;
        }

        const availableDestinations =
            accounts.filter(
                (account) =>
                    account.id !==
                    nextAccount.id &&
                    account.currency ===
                    nextAccount.currency
            );

        const currentDestinationIsValid =
            availableDestinations.some(
                (account) =>
                    account.id ===
                    toAccountId
            );

        if (!currentDestinationIsValid) {
            setToAccountId(
                availableDestinations[0]?.id ??
                ""
            );
        }
    }

    return (
        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/7 via-card to-transparent">
            <CardContent className="p-6">
                <form
                    action={formAction}
                    className="space-y-6"
                    aria-busy={isPending}
                >
                    {initialValues?.id ? (
                        <input
                            type="hidden"
                            name="transferId"
                            value={initialValues.id}
                        />
                    ) : null}

                    <input
                        type="hidden"
                        name="fromAccountId"
                        value={fromAccountId}
                    />

                    <input
                        type="hidden"
                        name="toAccountId"
                        value={toAccountId}
                    />

                    <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-end">
                        <div className="space-y-2">
                            <Label>
                                From account
                            </Label>

                            <Select
                                items={
                                    fromAccountItems
                                }
                                value={
                                    fromAccountId
                                }
                                onValueChange={(
                                    value
                                ) => {
                                    if (value) {
                                        changeFromAccount(
                                            value
                                        );
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select source account" />
                                </SelectTrigger>

                                <SelectContent>
                                    {fromAccountItems.map(
                                        (account) => (
                                            <SelectItem
                                                key={
                                                    account.value
                                                }
                                                value={
                                                    account.value
                                                }
                                            >
                                                {
                                                    account.label
                                                }
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>

                            {selectedFromAccount ? (
                                <p className="text-xs text-muted-foreground">
                                    Available balance:{" "}
                                    {formatBalance(
                                        selectedFromAccount.current_balance,
                                        selectedFromAccount.currency
                                    )}
                                </p>
                            ) : null}

                            {state.fieldErrors
                                ?.fromAccountId
                                ?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state
                                            .fieldErrors
                                            .fromAccountId[0]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="hidden pb-8 md:flex">
                            <div className="flex size-9 items-center justify-center rounded-full border bg-muted/40 text-muted-foreground">
                                <ArrowRight className="size-4" />
                            </div>
                        </div>

                        <div className="flex justify-center md:hidden">
                            <ArrowDown className="size-4 text-muted-foreground" />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                To account
                            </Label>

                            <Select
                                items={toAccountItems}
                                value={toAccountId}
                                onValueChange={(
                                    value
                                ) => {
                                    if (value) {
                                        setToAccountId(
                                            value
                                        );
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select destination account" />
                                </SelectTrigger>

                                <SelectContent>
                                    {toAccountItems.map(
                                        (account) => (
                                            <SelectItem
                                                key={
                                                    account.value
                                                }
                                                value={
                                                    account.value
                                                }
                                            >
                                                {
                                                    account.label
                                                }
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>

                            {selectedFromAccount &&
                                compatibleDestinationAccounts.length ===
                                0 ? (
                                <p className="text-xs text-destructive">
                                    No other active{" "}
                                    {
                                        selectedFromAccount.currency
                                    }{" "}
                                    account is available.
                                </p>
                            ) : selectedToAccount ? (
                                <p className="text-xs text-muted-foreground">
                                    Current balance:{" "}
                                    {formatBalance(
                                        selectedToAccount.current_balance,
                                        selectedToAccount.currency
                                    )}
                                </p>
                            ) : null}

                            {state.fieldErrors
                                ?.toAccountId?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state
                                            .fieldErrors
                                            .toAccountId[0]
                                    }
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">
                            Amount
                        </Label>

                        <div className="relative">
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                inputMode="decimal"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                defaultValue={
                                    initialValues?.amount
                                }
                                className="h-14 pr-20 text-xl font-semibold"
                                required
                            />

                            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted-foreground">
                                {selectedFromAccount?.currency ??
                                    "AED"}
                            </span>
                        </div>

                        {state.fieldErrors
                            ?.amount?.[0] ? (
                            <p className="text-xs text-destructive">
                                {
                                    state.fieldErrors
                                        .amount[0]
                                }
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="transferDate">
                                Date
                            </Label>

                            <Input
                                id="transferDate"
                                name="transferDate"
                                type="date"
                                defaultValue={
                                    initialValues?.transferDate ??
                                    getTodayDate()
                                }
                                required
                            />

                            {state.fieldErrors
                                ?.transferDate
                                ?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state
                                            .fieldErrors
                                            .transferDate[0]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">
                                Notes
                            </Label>

                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="ATM withdrawal, moved to savings..."
                                defaultValue={
                                    initialValues?.notes
                                }
                                maxLength={500}
                                rows={3}
                            />

                            {state.fieldErrors
                                ?.notes?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state.fieldErrors
                                            .notes[0]
                                    }
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {state.message ? (
                        <p
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm",
                                state.success
                                    ? "bg-primary/10 text-primary"
                                    : "bg-destructive/10 text-destructive"
                            )}
                        >
                            {state.message}
                        </p>
                    ) : null}

                    <div className="flex justify-end gap-2">
                        <Link
                            href="/transfers"
                            aria-disabled={
                                isPending
                            }
                            className={cn(
                                buttonVariants({
                                    variant:
                                        "outline",
                                }),
                                isPending &&
                                "pointer-events-none opacity-50"
                            )}
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={
                                isPending ||
                                accounts.length < 2 ||
                                compatibleDestinationAccounts.length ===
                                0
                            }
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />

                                    {isEditMode
                                        ? "Updating..."
                                        : "Transferring..."}
                                </>
                            ) : isEditMode ? (
                                "Update transfer"
                            ) : (
                                "Transfer money"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}