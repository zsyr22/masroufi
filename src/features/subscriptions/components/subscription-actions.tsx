"use client";

import {
    useActionState,
    useState,
} from "react";
import Link from "next/link";
import {
    Loader2,
    Pause,
    Pencil,
    Play,
    Archive,
} from "lucide-react";

import {
    Button,
    buttonVariants,
} from "@/components/ui/button";

import {
    changeSubscriptionStatus,
    deleteSubscription,
    type SubscriptionActionState,
} from "@/features/subscriptions/actions/subscription-actions";
import type { SubscriptionStatus } from "@/features/subscriptions/types/subscription";
import type { AccountWithBalance } from "@/features/accounts/types/account";
import { RecordSubscriptionPaymentDialog } from "@/features/subscriptions/components/subscription-payment-actions";
import { cn } from "@/lib/utils";

type SubscriptionActionsProps = {
    subscriptionId: string;
    status: SubscriptionStatus;
    nextPaymentDate: string | null;
    canRecordPayment: boolean;
    subscriptionName: string;
    expectedAmount: number;
    currency: string;
    defaultAccountId: string | null;
    accounts: AccountWithBalance[];
};

const initialState: SubscriptionActionState = {};

export function SubscriptionActions({
    subscriptionId,
    status,
    nextPaymentDate,
    canRecordPayment,
    subscriptionName,
    expectedAmount,
    currency,
    defaultAccountId,
    accounts,
}: SubscriptionActionsProps) {
    const [
        statusState,
        statusAction,
        isStatusPending,
    ] = useActionState(
        changeSubscriptionStatus,
        initialState
    );

    const [
        deleteState,
        deleteAction,
        isArchivePending,
    ] = useActionState(
        deleteSubscription,
        initialState
    );

    const [showArchive, setShowArchive] =
        useState(false);

    const isPending =
        isStatusPending ||
        isArchivePending;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {status === "active" ? (
                    <>
                        <RecordSubscriptionPaymentDialog
                            subscriptionId={subscriptionId}
                            subscriptionName={subscriptionName}
                            expectedAmount={expectedAmount}
                            currency={currency}
                            defaultAccountId={defaultAccountId}
                            accounts={accounts}
                            disabled={isPending || !canRecordPayment || !nextPaymentDate}
                        />

                        <form action={statusAction}>
                            <input
                                type="hidden"
                                name="subscriptionId"
                                value={subscriptionId}
                            />

                            <input
                                type="hidden"
                                name="status"
                                value="paused"
                            />

                            <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                            >
                                <Pause className="size-4" />
                                Pause
                            </Button>
                        </form>
                    </>
                ) : status === "paused" || status === "cancelled" ? (
                    <form action={statusAction}>
                        <input
                            type="hidden"
                            name="subscriptionId"
                            value={subscriptionId}
                        />

                        <input
                            type="hidden"
                            name="status"
                            value="active"
                        />

                        <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                        >
                            {isStatusPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Play className="size-4" />
                            )}

                            Activate
                        </Button>
                    </form>
                ) : null}

                <Link
                    href={`/subscriptions/${subscriptionId}/edit`}
                    className={cn(
                        buttonVariants({
                            variant: "outline",
                            size: "sm",
                        }),
                        isPending &&
                        "pointer-events-none opacity-50"
                    )}
                >
                    <Pencil className="size-4" />
                    Edit
                </Link>

                {!showArchive ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                            setShowArchive(true)
                        }
                    >
                        <Archive className="size-4" />
                        Archive
                    </Button>
                ) : null}
            </div>

            {showArchive ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-medium">
                        Archive this subscription?
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Existing payment history will always be preserved. Unused subscriptions can be deleted permanently.
                    </p>

                    <div className="mt-3 flex gap-2">
                        <form action={deleteAction}>
                            <input
                                type="hidden"
                                name="subscriptionId"
                                value={subscriptionId}
                            />

                            <Button
                                type="submit"
                                size="sm"
                                variant="destructive"
                                disabled={isPending}
                            >
                                {isArchivePending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Archive className="size-4" />
                                )}

                                Confirm archive
                            </Button>
                        </form>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                                setShowArchive(false)
                            }
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : null}

            {statusState.message ? (
                <p
                    className={cn(
                        "text-xs",
                        statusState.success
                            ? "text-primary"
                            : "text-destructive"
                    )}
                >
                    {statusState.message}
                </p>
            ) : null}

            {deleteState.message &&
                !deleteState.success ? (
                <p className="text-xs text-destructive">
                    {deleteState.message}
                </p>
            ) : null}
        </div>
    );
}