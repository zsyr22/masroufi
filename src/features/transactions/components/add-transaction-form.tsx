"use client";

import { useActionState, useMemo, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Loader2,
    Settings2,
} from "lucide-react";

import type { Account } from "@/features/accounts/types/account";
import {
    createTransaction,
    updateTransaction,
    type CreateTransactionState,
} from "@/features/transactions/actions/transaction-actions";
import type {
    Category,
    TransactionType,
} from "@/features/transactions/types/transaction";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";


export type TransactionFormInitialValues = {
    id: string;
    type: TransactionType;
    amount: number;
    accountId: string;
    categoryId: string;
    payeeName: string;
    payeeType: string;
    transactionDate: string;
    notes: string;
};

type AddTransactionFormProps = {
    accounts: Account[];
    categories: Category[];
    mode?: "create" | "edit";
    initialValues?: TransactionFormInitialValues;
};

const initialState: CreateTransactionState = {};

function getTodayDate(): string {
    const date = new Date();
    const timezoneOffset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
}

export function AddTransactionForm({
    accounts,
    categories,
    mode = "create",
    initialValues,
}: AddTransactionFormProps) {
    const isEditMode = mode === "edit";

    const [type, setType] = useState<TransactionType>(
        initialValues?.type ?? "expense"
    );

    const [accountId, setAccountId] = useState(
        initialValues?.accountId ??
        accounts[0]?.id ??
        ""
    );

    const [categoryId, setCategoryId] = useState(
        initialValues?.categoryId ?? ""
    );

    const [payeeType, setPayeeType] = useState(
        initialValues?.payeeType ??
        (initialValues?.type === "income"
            ? "company"
            : "store")
    );

    const transactionAction = isEditMode
        ? updateTransaction
        : createTransaction;

    const [state, formAction, isPending] = useActionState(
        transactionAction,
        initialState
    );

    const selectedAccount = accounts.find(
        (account) => account.id === accountId
    );

    const filteredCategories = useMemo(
        () =>
            categories.filter(
                (category) => category.transaction_type === type
            ),
        [categories, type]
    );
    const accountItems = accounts.map((account) => ({
        value: account.id,
        label: `${account.name} · ${account.currency}`,
    }));

    const categoryItems = filteredCategories.map((category) => ({
        value: category.id,
        label: category.name,
    }));

    const payeeTypeItems = [
        { value: "store", label: "Store" },
        { value: "restaurant", label: "Restaurant" },
        { value: "company", label: "Company" },
        { value: "government", label: "Government" },
        { value: "person", label: "Person" },
        { value: "other", label: "Other" },
    ];
    function changeType(nextType: TransactionType) {
        setType(nextType);
        setCategoryId("");
        setPayeeType(nextType === "income" ? "company" : "store");
    }

    return (
        <Card className="border-border/70">
            <CardContent className="p-6">
                <form
                    action={formAction}
                    className="space-y-6"
                    aria-busy={isPending}
                >
                    {initialValues?.id ? (
                        <input
                            type="hidden"
                            name="transactionId"
                            value={initialValues.id}
                        />
                    ) : null}

                    <input type="hidden" name="type" value={type} />
                    <input type="hidden" name="accountId" value={accountId} />
                    <input type="hidden" name="categoryId" value={categoryId} />
                    <input type="hidden" name="payeeType" value={payeeType} />
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1">
                        <button
                            type="button"
                            onClick={() => changeType("expense")}
                            className={cn(
                                "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                                type === "expense"
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ArrowUpRight className="size-4 text-destructive" />
                            Expense
                        </button>

                        <button
                            type="button"
                            onClick={() => changeType("income")}
                            className={cn(
                                "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                                type === "income"
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ArrowDownLeft className="size-4 text-primary" />
                            Income
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>

                        <div className="relative">
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                inputMode="decimal"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                defaultValue={initialValues?.amount}
                                className="h-14 pr-20 text-xl font-semibold"
                                required
                            />

                            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted-foreground">
                                {selectedAccount?.currency ?? "AED"}
                            </span>
                        </div>

                        {state.fieldErrors?.amount?.[0] ? (
                            <p className="text-xs text-destructive">
                                {state.fieldErrors.amount[0]}
                            </p>
                        ) : null}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Account</Label>

                            <Select
                                items={accountItems}
                                value={accountId}
                                onValueChange={(value) => {
                                    if (value) {
                                        setAccountId(value);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>

                                <SelectContent>
                                    {accountItems.map((account) => (
                                        <SelectItem
                                            key={account.value}
                                            value={account.value}
                                        >
                                            {account.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label>Category</Label>

                                <Link
                                    href="/categories"
                                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                                >
                                    <Settings2 className="size-3.5" />
                                    Manage
                                </Link>
                            </div>
                            <Select
                                items={categoryItems}
                                value={categoryId}
                                onValueChange={(value) => {
                                    if (value) {
                                        setCategoryId(value);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>

                                <SelectContent>
                                    {categoryItems.map((category) => (
                                        <SelectItem
                                            key={category.value}
                                            value={category.value}
                                        >
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {state.fieldErrors?.categoryId?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {state.fieldErrors.categoryId[0]}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="payeeName">
                                {type === "expense"
                                    ? "Store or payee"
                                    : "Income source"}
                            </Label>

                            <Input
                                id="payeeName"
                                name="payeeName"
                                placeholder={
                                    type === "expense"
                                        ? "Carrefour, ENOC, Tala..."
                                        : "Employer, refund..."
                                }
                                defaultValue={initialValues?.payeeName}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Payee type</Label>

                            <Select
                                items={payeeTypeItems}
                                value={payeeType}
                                onValueChange={(value) => {
                                    if (value) {
                                        setPayeeType(value);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {payeeTypeItems.map((item) => (
                                        <SelectItem
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="transactionDate">Date</Label>

                            <Input
                                id="transactionDate"
                                name="transactionDate"
                                type="date"
                                defaultValue={
                                    initialValues?.transactionDate ?? getTodayDate()
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>

                            <Input
                                id="notes"
                                name="notes"
                                placeholder="Optional details"
                                defaultValue={initialValues?.notes}
                                maxLength={500}
                            />

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
                            href="/transactions"
                            aria-disabled={isPending}
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                isPending && "pointer-events-none opacity-50"
                            )}
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    {isEditMode ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                isEditMode
                                    ? "Update transaction"
                                    : "Save transaction"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}