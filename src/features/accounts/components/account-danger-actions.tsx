"use client";

import {
    useState,
    useTransition,
} from "react";
import {
    Archive,
    Loader2,
    Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    archiveAccount,
    deleteAccount,
} from "@/features/accounts/actions/account-actions";

type Props = {
    accountId: string;
    accountName: string;
};

type ActionType =
    | "archive"
    | "delete"
    | null;

export function AccountDangerActions({
    accountId,
    accountName,
}: Props) {
    const [actionType, setActionType] =
        useState<ActionType>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    const [isPending, startTransition] =
        useTransition();

    function handleAction() {
        if (!actionType) {
            return;
        }

        setMessage(null);

        startTransition(async () => {
            const result =
                actionType === "archive"
                    ? await archiveAccount(
                        accountId
                    )
                    : await deleteAccount(
                        accountId
                    );

            if (!result.success) {
                setMessage(
                    result.message ??
                    "The action could not be completed."
                );

                return;
            }

            setActionType(null);
        });
    }

    const isArchive =
        actionType === "archive";

    return (
        <>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setMessage(null);
                        setActionType("archive");
                    }}
                >
                    <Archive className="size-4" />
                    Archive
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${accountName}`}
                    onClick={() => {
                        setMessage(null);
                        setActionType("delete");
                    }}
                >
                    <Trash2 className="size-4" />
                </Button>
            </div>

            <Dialog
                open={actionType !== null}
                onOpenChange={(open) => {
                    if (!open && !isPending) {
                        setActionType(null);
                        setMessage(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isArchive
                                ? "Archive account?"
                                : "Delete account?"}
                        </DialogTitle>

                        <DialogDescription>
                            {isArchive
                                ? `${accountName} will no longer appear when adding new transactions. Its transaction history will remain available.`
                                : `${accountName} will be permanently deleted. Accounts with transactions cannot be deleted.`}
                        </DialogDescription>
                    </DialogHeader>

                    {message && (
                        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {message}
                        </p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                                setActionType(null)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant={
                                isArchive
                                    ? "default"
                                    : "destructive"
                            }
                            disabled={isPending}
                            onClick={handleAction}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Processing...
                                </>
                            ) : isArchive ? (
                                <>
                                    <Archive className="size-4" />
                                    Archive account
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-4" />
                                    Delete account
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}