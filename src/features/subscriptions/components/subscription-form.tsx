"use client";

import {
    useActionState,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import {
    CalendarClock,
    Loader2,
    Repeat2,
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
import { Switch } from "@/components/ui/switch";

import type { Account } from "@/features/accounts/types/account";
import {
    createSubscription,
    updateSubscription,
    type SubscriptionActionState,
} from "@/features/subscriptions/actions/subscription-actions";
import type {
    SubscriptionBillingCycle,
    SubscriptionDurationType,
} from "@/features/subscriptions/types/subscription";
import {
    calculateContractEndDate,
} from "@/features/subscriptions/utils/subscription-utils";
import type { Category } from "@/features/transactions/types/transaction";
import { cn } from "@/lib/utils";

export type SubscriptionFormInitialValues = {
    id: string;
    name: string;
    provider: string;
    amount: number;
    currency: "AED" | "USD";

    billingCycle:
    SubscriptionBillingCycle;

    startDate: string;
    nextPaymentDate: string;

    durationType:
    SubscriptionDurationType;

    durationMonths: number | null;
    totalPayments: number | null;

    autoRenew: boolean;

    accountId: string;
    categoryId: string;
    notes: string;
};

type SubscriptionFormProps = {
    accounts: Account[];
    categories: Category[];

    mode?: "create" | "edit";

    initialValues?:
    SubscriptionFormInitialValues;
};

const initialState: SubscriptionActionState =
    {};

function getTodayDate(): string {
    const date = new Date();

    const timezoneOffset =
        date.getTimezoneOffset() *
        60_000;

    return new Date(
        date.getTime() -
        timezoneOffset
    )
        .toISOString()
        .slice(0, 10);
}

export function SubscriptionForm({
    accounts,
    categories,
    mode = "create",
    initialValues,
}: SubscriptionFormProps) {
    const isEditMode =
        mode === "edit";

    const today = getTodayDate();

    const [accountId, setAccountId] =
        useState(
            initialValues?.accountId ??
            accounts[0]?.id ??
            ""
        );

    const selectedAccount =
        accounts.find(
            (account) =>
                account.id ===
                accountId
        );

    const [currency, setCurrency] =
        useState<"AED" | "USD">(
            initialValues?.currency ??
            selectedAccount
                ?.currency ??
            "AED"
        );

    const [
        billingCycle,
        setBillingCycle,
    ] =
        useState<SubscriptionBillingCycle>(
            initialValues?.billingCycle ??
            "monthly"
        );

    const [
        durationType,
        setDurationType,
    ] =
        useState<SubscriptionDurationType>(
            initialValues?.durationType ??
            "ongoing"
        );

    const [
        durationMonths,
        setDurationMonths,
    ] = useState(
        initialValues
            ?.durationMonths?.toString() ??
        "12"
    );

    const [
        totalPayments,
        setTotalPayments,
    ] = useState(
        initialValues
            ?.totalPayments?.toString() ??
        "12"
    );

    const [startDate, setStartDate] =
        useState(
            initialValues?.startDate ??
            today
        );

    const [
        nextPaymentDate,
        setNextPaymentDate,
    ] = useState(
        initialValues
            ?.nextPaymentDate ??
        today
    );

    const [
        categoryId,
        setCategoryId,
    ] = useState(
        initialValues?.categoryId ??
        ""
    );

    const [
        autoRenew,
        setAutoRenew,
    ] = useState(
        initialValues?.autoRenew ??
        false
    );

    const action = isEditMode
        ? updateSubscription
        : createSubscription;

    const [
        state,
        formAction,
        isPending,
    ] = useActionState(
        action,
        initialState
    );

    const expenseCategories =
        categories.filter(
            (category) =>
                category.transaction_type ===
                "expense"
        );

    const accountItems =
        accounts.map(
            (account) => ({
                value: account.id,
                label: `${account.name} · ${account.currency}`,
            })
        );

    const categoryItems =
        expenseCategories.map(
            (category) => ({
                value: category.id,
                label: category.name,
            })
        );

    const billingCycleItems = [
        {
            value: "one_time",
            label:
                "One-time payment",
        },
        {
            value: "weekly",
            label: "Weekly payment",
        },
        {
            value: "monthly",
            label: "Monthly payment",
        },
        {
            value: "quarterly",
            label:
                "Payment every 3 months",
        },
        {
            value: "yearly",
            label: "Yearly payment",
        },
    ];

    const durationTypeItems = [
        {
            value: "ongoing",
            label:
                "Ongoing — no end date",
        },
        {
            value: "fixed_period",
            label:
                "Fixed contract duration",
        },
        {
            value: "payment_count",
            label:
                "Fixed number of payments",
        },
    ];

    const calculatedEndDate =
        useMemo(() => {
            if (
                durationType !==
                "fixed_period"
            ) {
                return null;
            }

            const months =
                Number(
                    durationMonths
                );

            if (
                !startDate ||
                !Number.isInteger(
                    months
                ) ||
                months <= 0
            ) {
                return null;
            }

            return calculateContractEndDate(
                startDate,
                months
            );
        }, [
            durationMonths,
            durationType,
            startDate,
        ]);

    function changeAccount(
        nextAccountId: string
    ) {
        setAccountId(
            nextAccountId
        );

        const nextAccount =
            accounts.find(
                (account) =>
                    account.id ===
                    nextAccountId
            );

        if (nextAccount) {
            setCurrency(
                nextAccount.currency
            );
        }
    }

    function changeBillingCycle(
        value:
            SubscriptionBillingCycle
    ) {
        setBillingCycle(value);

        if (
            value === "one_time"
        ) {
            setDurationType(
                "fixed_period"
            );

            if (
                !durationMonths
            ) {
                setDurationMonths(
                    "1"
                );
            }

            setAutoRenew(false);
        }
    }

    function changeDurationType(
        value:
            SubscriptionDurationType
    ) {
        setDurationType(value);

        if (
            value === "ongoing"
        ) {
            setAutoRenew(false);
        }
    }

    return (
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/7 via-card to-transparent">
            <CardContent className="p-6">
                <form
                    action={formAction}
                    className="space-y-7"
                    aria-busy={
                        isPending
                    }
                >
                    {initialValues?.id ? (
                        <input
                            type="hidden"
                            name="subscriptionId"
                            value={
                                initialValues.id
                            }
                        />
                    ) : null}

                    <input
                        type="hidden"
                        name="currency"
                        value={currency}
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
                        name="billingCycle"
                        value={
                            billingCycle
                        }
                    />

                    <input
                        type="hidden"
                        name="durationType"
                        value={
                            durationType
                        }
                    />

                    <input
                        type="hidden"
                        name="autoRenew"
                        value={String(
                            autoRenew
                        )}
                    />

                    <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Repeat2 className="size-5" />
                        </div>

                        <div>
                            <h2 className="font-medium">
                                Subscription
                                details
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Payment frequency
                                and contract
                                duration are
                                managed separately.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Subscription
                                name
                            </Label>

                            <Input
                                id="name"
                                name="name"
                                placeholder="Kaspersky, mobile plan..."
                                defaultValue={
                                    initialValues?.name
                                }
                                maxLength={
                                    100
                                }
                                required
                            />

                            {state
                                .fieldErrors
                                ?.name?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state
                                            .fieldErrors
                                            .name[0]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="provider">
                                Provider
                            </Label>

                            <Input
                                id="provider"
                                name="provider"
                                placeholder="Kaspersky, e&..."
                                defaultValue={
                                    initialValues?.provider
                                }
                                maxLength={
                                    100
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                Payment
                                amount
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
                                    className="h-12 pr-20 text-lg font-semibold"
                                    required
                                />

                                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted-foreground">
                                    {
                                        currency
                                    }
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Amount of each
                                payment, not the
                                full contract value.
                            </p>

                            {state
                                .fieldErrors
                                ?.amount?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state
                                            .fieldErrors
                                            .amount[0]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Payment
                                frequency
                            </Label>

                            <Select
                                items={
                                    billingCycleItems
                                }
                                value={
                                    billingCycle
                                }
                                onValueChange={(
                                    value
                                ) => {
                                    if (
                                        value
                                    ) {
                                        changeBillingCycle(
                                            value as SubscriptionBillingCycle
                                        );
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {billingCycleItems.map(
                                        (
                                            item
                                        ) => (
                                            <SelectItem
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.label
                                                }
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>

                            <p className="text-xs text-muted-foreground">
                                How often you
                                actually pay this
                                amount.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-muted/10 p-5">
                        <div className="mb-5">
                            <h3 className="font-medium">
                                Contract duration
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Define how long
                                the subscription
                                remains active.
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label>
                                    Duration type
                                </Label>

                                <Select
                                    items={
                                        durationTypeItems
                                    }
                                    value={
                                        durationType
                                    }
                                    onValueChange={(
                                        value
                                    ) => {
                                        if (
                                            value
                                        ) {
                                            changeDurationType(
                                                value as SubscriptionDurationType
                                            );
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {durationTypeItems.map(
                                            (
                                                item
                                            ) => (
                                                <SelectItem
                                                    key={
                                                        item.value
                                                    }
                                                    value={
                                                        item.value
                                                    }
                                                >
                                                    {
                                                        item.label
                                                    }
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {durationType ===
                                "fixed_period" ? (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="durationMonths">
                                            Contract
                                            duration
                                            in months
                                        </Label>

                                        <Input
                                            id="durationMonths"
                                            name="durationMonths"
                                            type="number"
                                            inputMode="numeric"
                                            min="1"
                                            step="1"
                                            value={
                                                durationMonths
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setDurationMonths(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            required
                                        />

                                        {state
                                            .fieldErrors
                                            ?.durationMonths?.[0] ? (
                                            <p className="text-xs text-destructive">
                                                {
                                                    state
                                                        .fieldErrors
                                                        .durationMonths[0]
                                                }
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>
                                            Calculated
                                            end date
                                        </Label>

                                        <Input
                                            value={
                                                calculatedEndDate ??
                                                ""
                                            }
                                            placeholder="Calculated automatically"
                                            readOnly
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {durationType ===
                                "payment_count" ? (
                                <div className="space-y-2">
                                    <Label htmlFor="totalPayments">
                                        Total number
                                        of payments
                                    </Label>

                                    <Input
                                        id="totalPayments"
                                        name="totalPayments"
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        step="1"
                                        value={
                                            totalPayments
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setTotalPayments(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        required
                                    />

                                    {state
                                        .fieldErrors
                                        ?.totalPayments?.[0] ? (
                                        <p className="text-xs text-destructive">
                                            {
                                                state
                                                    .fieldErrors
                                                    .totalPayments[0]
                                            }
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}

                            {durationType ===
                                "ongoing" ? (
                                <>
                                    <input
                                        type="hidden"
                                        name="durationMonths"
                                        value=""
                                    />

                                    <input
                                        type="hidden"
                                        name="totalPayments"
                                        value=""
                                    />
                                </>
                            ) : null}

                            {durationType ===
                                "fixed_period" ? (
                                <input
                                    type="hidden"
                                    name="totalPayments"
                                    value=""
                                />
                            ) : null}

                            {durationType ===
                                "payment_count" ? (
                                <input
                                    type="hidden"
                                    name="durationMonths"
                                    value=""
                                />
                            ) : null}

                            {durationType !==
                                "ongoing" ? (
                                <div className="flex items-start justify-between gap-4 rounded-lg border bg-background/50 p-4">
                                    <div>
                                        <Label htmlFor="autoRenew">
                                            Auto renew
                                        </Label>

                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            Start a new
                                            contract period
                                            after this one
                                            ends.
                                        </p>
                                    </div>

                                    <Switch
                                        id="autoRenew"
                                        checked={
                                            autoRenew
                                        }
                                        onCheckedChange={
                                            setAutoRenew
                                        }
                                        disabled={
                                            billingCycle ===
                                            "one_time"
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">
                                Contract
                                start date
                            </Label>

                            <Input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={
                                    startDate
                                }
                                onChange={(
                                    event
                                ) =>
                                    setStartDate(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                required
                            />

                            {state
                                .fieldErrors
                                ?.startDate?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state
                                            .fieldErrors
                                            .startDate[0]
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nextPaymentDate">
                                Next payment
                                date
                            </Label>

                            <div className="relative">
                                <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    id="nextPaymentDate"
                                    name="nextPaymentDate"
                                    type="date"
                                    value={
                                        nextPaymentDate
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setNextPaymentDate(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>

                            {state
                                .fieldErrors
                                ?.nextPaymentDate?.[0] ? (
                                <p className="text-xs text-destructive">
                                    {
                                        state
                                            .fieldErrors
                                            .nextPaymentDate[0]
                                    }
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>
                                Payment
                                account
                            </Label>

                            <Select
                                items={
                                    accountItems
                                }
                                value={
                                    accountId
                                }
                                onValueChange={(
                                    value
                                ) => {
                                    if (
                                        value
                                    ) {
                                        changeAccount(
                                            value
                                        );
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>

                                <SelectContent>
                                    {accountItems.map(
                                        (
                                            account
                                        ) => (
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
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Expense
                                category
                            </Label>

                            <Select
                                items={
                                    categoryItems
                                }
                                value={
                                    categoryId
                                }
                                onValueChange={(
                                    value
                                ) => {
                                    if (
                                        value
                                    ) {
                                        setCategoryId(
                                            value
                                        );
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>

                                <SelectContent>
                                    {categoryItems.map(
                                        (
                                            category
                                        ) => (
                                            <SelectItem
                                                key={
                                                    category.value
                                                }
                                                value={
                                                    category.value
                                                }
                                            >
                                                {
                                                    category.label
                                                }
                                            </SelectItem>
                                        )
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
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

                    {state.message ? (
                        <div
                            className={cn(
                                "rounded-lg px-3 py-2 text-sm",
                                state.success
                                    ? "bg-primary/10 text-primary"
                                    : "bg-destructive/10 text-destructive"
                            )}
                        >
                            <p>
                                {state.message}
                            </p>

                            {state
                                .fieldErrors ? (
                                <div className="mt-2 space-y-1 text-xs">
                                    {Object.entries(
                                        state.fieldErrors
                                    ).map(
                                        ([
                                            field,
                                            errors,
                                        ]) =>
                                            errors?.[0] ? (
                                                <p
                                                    key={
                                                        field
                                                    }
                                                >
                                                    {
                                                        errors[0]
                                                    }
                                                </p>
                                            ) : null
                                    )}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2">
                        <Link
                            href="/subscriptions"
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
                                accounts.length ===
                                0
                            }
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />

                                    {isEditMode
                                        ? "Updating..."
                                        : "Saving..."}
                                </>
                            ) : isEditMode ? (
                                "Update subscription"
                            ) : (
                                "Add subscription"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}