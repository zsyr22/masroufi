import { CalendarDays, ReceiptText, WalletCards } from "lucide-react";

import type { AccountWithBalance } from "@/features/accounts/types/account";
import {
    DeleteSubscriptionPaymentButton,
    EditSubscriptionPaymentDialog,
} from "@/features/subscriptions/components/subscription-payment-actions";
import type { SubscriptionPayment } from "@/features/subscriptions/types/subscription";

function formatMoney(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
}

export function SubscriptionPaymentHistory({
    payments,
    subscriptionName,
    currency,
    accounts,
}: {
    payments: SubscriptionPayment[];
    subscriptionName: string;
    currency: string;
    accounts: AccountWithBalance[];
}) {
    return (
        <div className="mt-5 overflow-hidden rounded-xl border border-violet-500/15 bg-background/30">
            <div className="border-b px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                    <ReceiptText className="size-4 text-violet-500" />
                    Payment history
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Historical payments keep the amount actually paid, even when the subscription price changes later.
                </p>
            </div>

            {payments.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No payments recorded yet.
                </div>
            ) : (
                <div className="divide-y">
                    {payments.map((payment) => (
                        <div key={payment.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">{formatMoney(Number(payment.amount), currency)}</p>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="size-3" />
                                        {formatDate(payment.paid_at)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <WalletCards className="size-3" />
                                        {payment.transaction?.account?.name ?? "Account"}
                                    </span>
                                    {payment.notes ? <span>{payment.notes}</span> : null}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <EditSubscriptionPaymentDialog
                                    payment={payment}
                                    subscriptionName={subscriptionName}
                                    currency={currency}
                                    accounts={accounts}
                                />
                                <DeleteSubscriptionPaymentButton payment={payment} subscriptionName={subscriptionName} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
