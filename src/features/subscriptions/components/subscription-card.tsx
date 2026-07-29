import {
    CalendarClock,
    CircleDollarSign,
    CreditCard,
    Folder,
    Repeat2,
    Timer,
} from "lucide-react";

import {
    Card,
    CardContent,
} from "@/components/ui/card";

import { SubscriptionActions } from "@/features/subscriptions/components/subscription-actions";
import type {
    SubscriptionListItem,
} from "@/features/subscriptions/types/subscription";
import {
    calculateEstimatedContractValue,
    calculateMonthlyEquivalent,
    getBillingCycleLabel,
    getDaysUntilPayment,
    getEstimatedContractPayments,
    getSubscriptionDurationLabel,
    getSubscriptionStatusLabel,
    isSubscriptionOverdue,
} from "@/features/subscriptions/utils/subscription-utils";
import { cn } from "@/lib/utils";

type SubscriptionCardProps = {
    subscription: SubscriptionListItem;
};

function formatMoney(
    amount: number,
    currency: string
): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(
        new Date(`${date}T00:00:00`)
    );
}

export function SubscriptionCard({
    subscription,
}: SubscriptionCardProps) {
    const amount =
        Number(subscription.amount);

    const monthlyEquivalent =
        calculateMonthlyEquivalent(
            amount,
            subscription.billing_cycle
        );

    const estimatedPayments =
        getEstimatedContractPayments({
            billingCycle:
                subscription.billing_cycle,

            durationType:
                subscription.duration_type,

            durationMonths:
                subscription.duration_months,

            totalPayments:
                subscription.total_payments,
        });

    const estimatedContractValue =
        calculateEstimatedContractValue({
            amount,

            billingCycle:
                subscription.billing_cycle,

            durationType:
                subscription.duration_type,

            durationMonths:
                subscription.duration_months,

            totalPayments:
                subscription.total_payments,
        });

    const remainingPayments =
        estimatedPayments === null
            ? null
            : Math.max(
                estimatedPayments -
                Number(
                    subscription.payments_made
                ),
                0
            );

    const overdue =
        isSubscriptionOverdue(
            subscription.next_payment_date,
            subscription.status
        );

    const daysUntilPayment =
        getDaysUntilPayment(
            subscription.next_payment_date
        );

    const paymentLabel =
        daysUntilPayment === null
            ? "No upcoming payment"
            : overdue
                ? `${Math.abs(
                    daysUntilPayment
                )} days overdue`
                : daysUntilPayment === 0
                    ? "Due today"
                    : `Due in ${daysUntilPayment} days`;

    const durationLabel =
        getSubscriptionDurationLabel({
            durationType:
                subscription.duration_type,

            durationMonths:
                subscription.duration_months,

            totalPayments:
                subscription.total_payments,
        });

    const statusLabel =
        getSubscriptionStatusLabel(
            subscription.status
        );

    return (
        <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/7 via-card to-transparent">
            <CardContent className="p-5">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Repeat2 className="size-5" />
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="truncate text-lg font-semibold">
                                        {
                                            subscription.name
                                        }
                                    </h2>

                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-0.5 text-xs font-medium",

                                            subscription.status ===
                                            "active" &&
                                            "bg-primary/10 text-primary",

                                            subscription.status ===
                                            "paused" &&
                                            "bg-amber-500/10 text-amber-600",

                                            subscription.status ===
                                            "completed" &&
                                            "bg-blue-500/10 text-blue-600",

                                            subscription.status ===
                                            "cancelled" &&
                                            "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {statusLabel}
                                    </span>
                                </div>

                                {subscription.provider ? (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {
                                            subscription.provider
                                        }
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Payment amount
                                </p>

                                <p className="mt-1 font-semibold">
                                    {formatMoney(
                                        amount,
                                        subscription.currency
                                    )}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    {getBillingCycleLabel(
                                        subscription.billing_cycle
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Contract duration
                                </p>

                                <p className="mt-1 font-medium">
                                    {durationLabel}
                                </p>

                                {subscription.end_date ? (
                                    <p className="text-xs text-muted-foreground">
                                        Until{" "}
                                        {formatDate(
                                            subscription.end_date
                                        )}
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        No fixed end date
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Contract value
                                </p>

                                <p className="mt-1 font-medium">
                                    {estimatedContractValue !==
                                        null
                                        ? formatMoney(
                                            estimatedContractValue,
                                            subscription.currency
                                        )
                                        : "Ongoing"}
                                </p>

                                {estimatedPayments !==
                                    null ? (
                                    <p className="text-xs text-muted-foreground">
                                        {
                                            estimatedPayments
                                        }{" "}
                                        {estimatedPayments ===
                                            1
                                            ? "payment"
                                            : "payments"}
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        No final total
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Next payment
                                </p>

                                <p
                                    className={cn(
                                        "mt-1 font-medium",
                                        overdue &&
                                        "text-destructive"
                                    )}
                                >
                                    {subscription.next_payment_date
                                        ? formatDate(
                                            subscription.next_payment_date
                                        )
                                        : "No upcoming payment"}
                                </p>

                                {subscription.status ===
                                    "active" &&
                                    subscription.next_payment_date ? (
                                    <p
                                        className={cn(
                                            "text-xs",
                                            overdue
                                                ? "text-destructive"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {paymentLabel}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 rounded-xl border bg-muted/10 p-4 text-sm sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Payments made
                                </p>

                                <p className="mt-1 font-medium">
                                    {
                                        subscription.payments_made
                                    }
                                    {estimatedPayments !==
                                        null
                                        ? ` of ${estimatedPayments}`
                                        : ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Remaining
                                </p>

                                <p className="mt-1 font-medium">
                                    {remainingPayments !==
                                        null
                                        ? remainingPayments
                                        : "Ongoing"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Monthly equivalent
                                </p>

                                <p className="mt-1 font-medium">
                                    {subscription.billing_cycle ===
                                        "one_time"
                                        ? "One-time"
                                        : formatMoney(
                                            monthlyEquivalent,
                                            subscription.currency
                                        )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <CreditCard className="size-3.5" />

                                {subscription.accounts
                                    ?.name ??
                                    "No account selected"}
                            </span>

                            <span className="flex items-center gap-1.5">
                                <Folder className="size-3.5" />

                                {subscription.categories
                                    ?.name ??
                                    "No category selected"}
                            </span>

                            <span className="flex items-center gap-1.5">
                                <Timer className="size-3.5" />

                                {durationLabel}
                            </span>

                            <span className="flex items-center gap-1.5">
                                <CircleDollarSign className="size-3.5" />

                                {getBillingCycleLabel(
                                    subscription.billing_cycle
                                )}
                            </span>

                            {subscription.last_paid_at ? (
                                <span className="flex items-center gap-1.5">
                                    <CalendarClock className="size-3.5" />

                                    Last paid{" "}
                                    {formatDate(
                                        subscription.last_paid_at
                                    )}
                                </span>
                            ) : null}
                        </div>

                        {subscription.auto_renew ? (
                            <p className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
                                This contract is set to
                                renew automatically.
                            </p>
                        ) : null}

                        {subscription.notes ? (
                            <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                {subscription.notes}
                            </p>
                        ) : null}
                    </div>

                    <div className="shrink-0 lg:w-72">
                        <SubscriptionActions
                            subscriptionId={
                                subscription.id
                            }
                            status={
                                subscription.status
                            }
                            nextPaymentDate={
                                subscription.next_payment_date
                            }
                            canRecordPayment={Boolean(
                                subscription.account_id &&
                                subscription.category_id &&
                                subscription.next_payment_date
                            )}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}