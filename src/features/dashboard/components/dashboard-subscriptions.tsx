import Link from "next/link";
import {
    AlertTriangle,
    ArrowRight,
    CalendarClock,
    Repeat2,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { formatMoney } from "@/features/accounts/utils/account-summary";
import type { SubscriptionListItem } from "@/features/subscriptions/types/subscription";
import {
    calculateMonthlyEquivalent,
    calculateYearlyEquivalent,
    getBillingCycleLabel,
    getDaysUntilPayment,
    isSubscriptionOverdue,
} from "@/features/subscriptions/utils/subscription-utils";

import { cn } from "@/lib/utils";

type DashboardSubscriptionsProps = {
    subscriptions: SubscriptionListItem[];
};

type CurrencyTotals = {
    AED: number;
    USD: number;
};

function formatDate(dateValue: string): string {
    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(
        new Date(`${dateValue}T00:00:00`)
    );
}

function getPaymentTimingLabel(
    nextPaymentDate: string
): string {
    const daysUntilPayment =
        getDaysUntilPayment(nextPaymentDate);

    if (daysUntilPayment === null) {
        return "No payment date";
    }

    if (daysUntilPayment < 0) {
        const overdueDays = Math.abs(
            daysUntilPayment
        );

        return overdueDays === 1
            ? "1 day overdue"
            : `${overdueDays} days overdue`;
    }

    if (daysUntilPayment === 0) {
        return "Due today";
    }

    if (daysUntilPayment === 1) {
        return "Due tomorrow";
    }

    return `Due in ${daysUntilPayment} days`;
}

export function DashboardSubscriptions({
    subscriptions,
}: DashboardSubscriptionsProps) {
    const activeSubscriptions =
        subscriptions.filter(
            (subscription) =>
                subscription.status === "active"
        );

    const recurringSubscriptions =
        activeSubscriptions.filter(
            (subscription) =>
                subscription.billing_cycle !==
                "one_time"
        );

    const overdueSubscriptions =
        activeSubscriptions.filter(
            (subscription) =>
                isSubscriptionOverdue(
                    subscription.next_payment_date,
                    subscription.status
                )
        );

    const upcomingSubscriptions =
        activeSubscriptions
            .filter(
                (
                    subscription
                ): subscription is SubscriptionListItem & {
                    next_payment_date: string;
                } =>
                    subscription.next_payment_date !==
                    null
            )
            .sort((first, second) =>
                first.next_payment_date.localeCompare(
                    second.next_payment_date
                )
            )
            .slice(0, 4);

    const monthlyTotals =
        recurringSubscriptions.reduce<CurrencyTotals>(
            (totals, subscription) => {
                totals[subscription.currency] +=
                    calculateMonthlyEquivalent(
                        Number(subscription.amount),
                        subscription.billing_cycle
                    );

                return totals;
            },
            {
                AED: 0,
                USD: 0,
            }
        );

    const yearlyTotals =
        recurringSubscriptions.reduce<CurrencyTotals>(
            (totals, subscription) => {
                totals[subscription.currency] +=
                    calculateYearlyEquivalent(
                        Number(subscription.amount),
                        subscription.billing_cycle
                    );

                return totals;
            },
            {
                AED: 0,
                USD: 0,
            }
        );

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Repeat2 className="size-4 text-primary" />
                        Subscriptions
                    </CardTitle>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Recurring commitments and upcoming
                        payments.
                    </p>
                </div>

                <Link
                    href="/subscriptions"
                    className={cn(
                        buttonVariants({
                            variant: "ghost",
                            size: "sm",
                        }),
                        "gap-1.5"
                    )}
                >
                    View all
                    <ArrowRight className="size-4" />
                </Link>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border bg-muted/10 p-4">
                        <p className="text-xs text-muted-foreground">
                            Active subscriptions
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                            {activeSubscriptions.length}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-muted/10 p-4">
                        <p className="text-xs text-muted-foreground">
                            Monthly commitment
                        </p>

                        <p className="mt-2 text-base font-semibold">
                            {formatMoney(
                                monthlyTotals.AED,
                                "AED"
                            )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            {formatMoney(
                                monthlyTotals.USD,
                                "USD"
                            )}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-muted/10 p-4">
                        <p className="text-xs text-muted-foreground">
                            Estimated yearly
                        </p>

                        <p className="mt-2 text-base font-semibold">
                            {formatMoney(
                                yearlyTotals.AED,
                                "AED"
                            )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            {formatMoney(
                                yearlyTotals.USD,
                                "USD"
                            )}
                        </p>
                    </div>

                    <div
                        className={cn(
                            "rounded-xl border p-4",
                            overdueSubscriptions.length > 0
                                ? "border-destructive/30 bg-destructive/5"
                                : "bg-muted/10"
                        )}
                    >
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {overdueSubscriptions.length >
                                0 ? (
                                <AlertTriangle className="size-3.5 text-destructive" />
                            ) : null}

                            Overdue payments
                        </p>

                        <p
                            className={cn(
                                "mt-2 text-xl font-semibold",
                                overdueSubscriptions.length >
                                0 &&
                                "text-destructive"
                            )}
                        >
                            {overdueSubscriptions.length}
                        </p>
                    </div>
                </div>

                <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium">
                            Upcoming payments
                        </h3>

                        <Link
                            href="/subscriptions/new"
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            Add subscription
                        </Link>
                    </div>

                    {upcomingSubscriptions.length ===
                        0 ? (
                        <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center">
                            <CalendarClock className="size-5 text-muted-foreground" />

                            <p className="mt-3 text-sm font-medium">
                                No upcoming payments
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Active subscription payments
                                will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border rounded-xl border">
                            {upcomingSubscriptions.map(
                                (subscription) => {
                                    const overdue =
                                        isSubscriptionOverdue(
                                            subscription.next_payment_date,
                                            subscription.status
                                        );

                                    return (
                                        <div
                                            key={subscription.id}
                                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                                        overdue
                                                            ? "bg-destructive/10 text-destructive"
                                                            : "bg-primary/10 text-primary"
                                                    )}
                                                >
                                                    {overdue ? (
                                                        <AlertTriangle className="size-4" />
                                                    ) : (
                                                        <CalendarClock className="size-4" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {subscription.name}
                                                    </p>

                                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {getBillingCycleLabel(
                                                            subscription.billing_cycle
                                                        )}
                                                        {" · "}
                                                        {subscription.accounts
                                                            ?.name ??
                                                            "No account"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="shrink-0 sm:text-right">
                                                <p className="text-sm font-semibold">
                                                    {formatMoney(
                                                        Number(
                                                            subscription.amount
                                                        ),
                                                        subscription.currency
                                                    )}
                                                </p>

                                                <p
                                                    className={cn(
                                                        "mt-0.5 text-xs",
                                                        overdue
                                                            ? "text-destructive"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {formatDate(
                                                        subscription.next_payment_date
                                                    )}
                                                    {" · "}
                                                    {getPaymentTimingLabel(
                                                        subscription.next_payment_date
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}