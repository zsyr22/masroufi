"use client";

import {
    useActionState,
    useState,
} from "react";
import {
    Loader2,
    Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
    deleteTransfer,
    type TransferActionState,
} from "@/features/transfers/actions/transfer-actions";

import { cn } from "@/lib/utils";

type DeleteTransferButtonProps = {
    transferId: string;
};

const initialState: TransferActionState =
    {};

export function DeleteTransferButton({
    transferId,
}: DeleteTransferButtonProps) {
    const [showConfirmation, setShowConfirmation] =
        useState(false);

    const [state, action, isPending] =
        useActionState(
            async (
                _previousState:
                    TransferActionState
            ) => {
                return deleteTransfer(
                    transferId
                );
            },
            initialState
        );

    return (
        <div className="space-y-2">
            {!showConfirmation ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setShowConfirmation(true)
                    }
                >
                    <Trash2 className="size-4" />
                    Delete
                </Button>
            ) : (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-medium">
                        Delete this transfer?
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Both account balances will
                        be recalculated automatically.
                    </p>

                    <div className="mt-3 flex gap-2">
                        <form action={action}>
                            <Button
                                type="submit"
                                size="sm"
                                variant="destructive"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Trash2 className="size-4" />
                                )}

                                Confirm
                            </Button>
                        </form>

                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                                setShowConfirmation(
                                    false
                                )
                            }
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {state.message ? (
                <p
                    className={cn(
                        "text-xs",
                        state.success
                            ? "text-primary"
                            : "text-destructive"
                    )}
                >
                    {state.message}
                </p>
            ) : null}
        </div>
    );
}