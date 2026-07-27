"use client";

import {
    useActionState,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Loader2,
    Settings2,
    Users,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";

import type { Account } from "@/features/accounts/types/account";
import type { Person } from "@/features/people/types/person";
import {
    createTransaction,
    updateTransaction,
    type CreateTransactionState,
} from "@/features/transactions/actions/transaction-actions";
import type {
    Category,
    TransactionType,
} from "@/features/transactions/types/transaction";

import { cn } from "@/lib/utils";

type PersonRelationship =
    | "paid_for_person"
    | "repayment_received"
    | "repayment_sent";

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
    involvesPerson: boolean;
    personId: string;
    personRelationship:
    | PersonRelationship
    | "";
};

type AddTransactionFormProps = {
    accounts: Account[];
    categories: Category[];
    people: Person[];
    mode?: "create" | "edit";
    initialValues?: TransactionFormInitialValues;
};

const initialState: CreateTransactionState = {};

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

export function AddTransactionForm({
    accounts,
    categories,
    people,
    mode = "create",
    initialValues,
}: AddTransactionFormProps) {
    const isEditMode = mode === "edit";

    const [type, setType] =
        useState<TransactionType>(
            initialValues?.type ?? "expense"
        );

    const [accountId, setAccountId] =
        useState(
            initialValues?.accountId ??
            accounts[0]?.id ??
            ""
        );

    const [categoryId, setCategoryId] =
        useState(
            initialValues?.categoryId ?? ""
        );

    const [payeeType, setPayeeType] =
        useState(
            initialValues?.payeeType ??
            (initialValues?.type === "income"
                ? "company"
                : "store")
        );

    const [
        involvesPerson,
        setInvolvesPerson,
    ] = useState(
        initialValues?.involvesPerson ?? false
    );

    const [personId, setPersonId] =
        useState(
            initialValues?.personId ?? ""
        );

    const [
        personRelationship,
        setPersonRelationship,
    ] = useState<PersonRelationship>(
        initialValues?.personRelationship ||
        (initialValues?.type === "income"
            ? "repayment_received"
            : "paid_for_person")
    );

    const transactionAction = isEditMode
        ? updateTransaction
        : createTransaction;

    const [state, formAction, isPending] =
        useActionState(
            transactionAction,
            initialState
        );

    const selectedAccount = accounts.find(
        (account) => account.id === accountId
    );

    const selectedPerson = people.find(
        (person) => person.id === personId
    );

    const filteredCategories = useMemo(
        () =>
            categories.filter(
                (category) =>
                    category.transaction_type === type
            ),
        [categories, type]
    );

    const accountItems = accounts.map(
        (account) => ({
            value: account.id,
            label: `${account.name} · ${account.currency}`,
        })
    );

    const categoryItems =
        filteredCategories.map((category) => ({
            value: category.id,
            label: category.name,
        }));

    const peopleItems = people.map(
        (person) => ({
            value: person.id,
            label: person.name,
        })
    );

    const payeeTypeItems = [
        {
            value: "store",
            label: "Store",
        },
        {
            value: "restaurant",
            label: "Restaurant",
        },
        {
            value: "company",
            label: "Company",
        },
        {
            value: "government",
            label: "Government",
        },
        {
            value: "person",
            label: "Person",
        },
        {
            value: "other",
            label: "Other",
        },
    ];

    const relationshipItems =
        type === "income"
            ? [
                {
                    value:
                        "repayment_received" as const,
                    label: selectedPerson
                        ? `${selectedPerson.name} repaid me`
                        : "They repaid me",
                },
            ]
            : [
                {
                    value:
                        "paid_for_person" as const,
                    label: selectedPerson
                        ? `I paid for ${selectedPerson.name}`
                        : "I paid for them",
                },
                {
                    value:
                        "repayment_sent" as const,
                    label: selectedPerson
                        ? `I repaid ${selectedPerson.name}`
                        : "I repaid them",
                },
            ];

    function changeType(
        nextType: TransactionType
    ) {
        setType(nextType);
        setCategoryId("");

        setPayeeType(
            nextType === "income"
                ? "company"
                : "store"
        );

        setPersonRelationship(
            nextType === "income"
                ? "repayment_received"
                : "paid_for_person"
        );
    }

    function changePersonInvolvement(
        checked: boolean
    ) {
        setInvolvesPerson(checked);

        if (!checked) {
            setPersonId("");
        }
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

                    <input
                        type="hidden"
                        name="type"
                        value={type}
                    />

                    <input
                        type="hidden"
                        name="accountId"
                        value={accountId}
                    />

                    <input
                        type="hidden"
                        name="categoryId"
                        value={categoryId}
                    />

                    <input
                        type="hidden"
                        name="payeeType"
                        value={payeeType}
                    />

                    <input
                        type="hidden"
                        name="involvesPerson"
                        value={String(
                            involvesPerson
                        )}
                    />

                    <input
                        type="hidden"
                        name="personId"
                        value={
                            involvesPerson
                                ? personId
                                : ""
                        }
                    />

                    <input
                        type="hidden"
                        name="personRelationship"
                        value={
                            involvesPerson
                                ? personRelationship
                                : ""
                        }
                    />

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1">
                        <button
                            type="button"
                            onClick={() =>
                                changeType("expense")
                            }
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
                            onClick={() =>
                                changeType("income")
                            }
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
                                {selectedAccount?.currency ??
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
                                    {accountItems.map(
                                        (account) => (
                                            <SelectItem
                                                key={account.value}
                                                value={account.value}
                                            >
                                                {account.label}
                                            </SelectItem>
                                        )
                                    )}
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
                                    {categoryItems.map(
                                        (category) => (
                                            <SelectItem
                                                key={category.value}
                                                value={
                                                    category.value
                                                }
                                            >
                                                {category.label}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>

                            {state.fieldErrors
                                ?.categoryId?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state.fieldErrors
                                            .categoryId[0]
                                    }
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
                                defaultValue={
                                    initialValues?.payeeName
                                }
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
                                    {payeeTypeItems.map(
                                        (item) => (
                                            <SelectItem
                                                key={item.value}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-muted/15 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Users className="size-4" />
                                </div>

                                <div>
                                    <Label htmlFor="involvesPerson">
                                        This transaction involves
                                        a person
                                    </Label>

                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Automatically update a
                                        person&apos;s balance when
                                        this transaction is saved.
                                    </p>
                                </div>
                            </div>

                            <Switch
                                id="involvesPerson"
                                checked={involvesPerson}
                                onCheckedChange={
                                    changePersonInvolvement
                                }
                                disabled={
                                    isPending ||
                                    people.length === 0
                                }
                            />
                        </div>

                        {people.length === 0 && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                Add a person from the{" "}
                                <Link
                                    href="/people"
                                    className="font-medium text-primary hover:underline"
                                >
                                    People page
                                </Link>{" "}
                                before linking a transaction.
                            </p>
                        )}

                        {involvesPerson && (
                            <div className="mt-5 grid gap-5 border-t pt-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Person</Label>

                                    <Select
                                        items={peopleItems}
                                        value={personId}
                                        onValueChange={(
                                            value
                                        ) => {
                                            if (value) {
                                                setPersonId(value);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select person" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {peopleItems.map(
                                                (person) => (
                                                    <SelectItem
                                                        key={
                                                            person.value
                                                        }
                                                        value={
                                                            person.value
                                                        }
                                                    >
                                                        {person.label}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {state.fieldErrors
                                        ?.personId?.[0] ? (
                                        <p className="text-xs text-destructive">
                                            {
                                                state.fieldErrors
                                                    .personId[0]
                                            }
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Balance effect
                                    </Label>

                                    <Select
                                        items={relationshipItems}
                                        value={
                                            personRelationship
                                        }
                                        onValueChange={(
                                            value
                                        ) => {
                                            if (value) {
                                                setPersonRelationship(
                                                    value as PersonRelationship
                                                );
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select relationship" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {relationshipItems.map(
                                                (item) => (
                                                    <SelectItem
                                                        key={item.value}
                                                        value={
                                                            item.value
                                                        }
                                                    >
                                                        {item.label}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {state.fieldErrors
                                        ?.personRelationship?.[0] ? (
                                        <p className="text-xs text-destructive">
                                            {
                                                state.fieldErrors
                                                    .personRelationship[0]
                                            }
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="transactionDate">
                                Date
                            </Label>

                            <Input
                                id="transactionDate"
                                name="transactionDate"
                                type="date"
                                defaultValue={
                                    initialValues?.transactionDate ??
                                    getTodayDate()
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">
                                Notes
                            </Label>

                            <Input
                                id="notes"
                                name="notes"
                                placeholder="Optional details"
                                defaultValue={
                                    initialValues?.notes
                                }
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
                                buttonVariants({
                                    variant: "outline",
                                }),
                                isPending &&
                                "pointer-events-none opacity-50"
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

                                    {isEditMode
                                        ? "Updating..."
                                        : "Saving..."}
                                </>
                            ) : isEditMode ? (
                                "Update transaction"
                            ) : (
                                "Save transaction"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}