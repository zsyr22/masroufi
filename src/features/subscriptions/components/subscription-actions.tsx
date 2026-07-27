"use client";

import {
    useActionState,
    useState,
} from "react";
import Link from "next/link";
import {
    CheckCircle2,
    Loader2,
    Pause,
    Pencil,
    Play,
    Trash2,
} from "lucide-react";

import {
    Button,
    buttonVariants,
} from "@/components/ui/button";

import {
    changeSubscriptionStatus,
    deleteSubscription,
    recordSubscriptionPayment,
    type SubscriptionActionState,
} from "@/features/subscriptions/actions/subscription-actions";
import type {
    SubscriptionStatus,
} from "@/features/subscriptions/types/subscription";
import { cn } from "@/lib/utils";

type SubscriptionActionsProps = {
    subscriptionId: string;
    status: SubscriptionStatus;
    nextPaymentDate: string | null;
    canRecordPayment: boolean;
};

const initialState: SubscriptionActionState = {};

export function SubscriptionActions({
    subscriptionId,
    status,
    nextPaymentDate,
    canRecordPayment,
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
        paymentState,
        paymentAction,
        isPaymentPending,
    ] = useActionState(
        recordSubscriptionPayment,
        initialState
    );

    const [
        deleteState,
        deleteAction,
        isDeletePending,
    ] = useActionState(
        deleteSubscription,
        initialState
    );

    const [showDelete, setShowDelete] =
        useState(false);

    const isPending =
        isStatusPending ||
        isPaymentPending ||
        isDeletePending;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {status === "active" ? (
                    <>
                        <form action={paymentAction}>
                            <input
                                type="hidden"
                                name="subscriptionId"
                                value={subscriptionId}
                            />

                            <input
                                type="hidden"
                                name="paymentDate"
                                value={nextPaymentDate ?? ""}
                            />

                            <Button
                                type="submit"
                                size="sm"
                                disabled={
                                    isPending ||
                                    !canRecordPayment ||
                                    !nextPaymentDate
                                }
                            >
                                {isPaymentPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="size-4" />
                                )}

                                Mark as paid
                            </Button>
                        </form>

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
                ) : (
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
                )}

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

                {!showDelete ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                            setShowDelete(true)
                        }
                    >
                        <Trash2 className="size-4" />
                        Delete
                    </Button>
                ) : null}
            </div>

            {showDelete ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-medium">
                        Delete this subscription?
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Existing payment transactions will
                        not be deleted.
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
                                {isDeletePending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Trash2 className="size-4" />
                                )}

                                Confirm delete
                            </Button>
                        </form>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                                setShowDelete(false)
                            }
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : null}

            {paymentState.message ? (
                <p
                    className={cn(
                        "text-xs",
                        paymentState.success
                            ? "text-primary"
                            : "text-destructive"
                    )}
                >
                    {paymentState.message}
                </p>
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