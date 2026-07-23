"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { deleteTransaction } from "@/features/transactions/actions/transaction-actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteTransactionButtonProps = {
    transactionId: string;
    transactionName: string;
};

export function DeleteTransactionButton({
    transactionId,
    transactionName,
}: DeleteTransactionButtonProps) {
    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        setErrorMessage(undefined);

        startTransition(async () => {
            const result = await deleteTransaction(transactionId);

            if (!result.success) {
                setErrorMessage(
                    result.message ?? "The transaction could not be deleted."
                );
                return;
            }

            setOpen(false);
        });
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
                render={
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${transactionName}`}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    />
                }
            >
                <Trash2 className="size-4" />
            </AlertDialogTrigger>

            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Delete this transaction?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        You are about to delete “{transactionName}”. Your account
                        balance and financial summaries will be recalculated.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {errorMessage ? (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {errorMessage}
                    </p>
                ) : null}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        type="button"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="size-4" />
                                Delete
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}