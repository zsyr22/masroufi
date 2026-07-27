"use client";

import {
    ArchiveRestore,
    Loader2,
} from "lucide-react";
import {
    useState,
    useTransition,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { restoreAccount } from "@/features/accounts/actions/account-actions";
import type { AccountWithBalance } from "@/features/accounts/types/account";

type Props = {
    accounts: AccountWithBalance[];
};

function formatBalance(
    amount: number,
    currency: string
) {
    return (
        new Intl.NumberFormat("en-AE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ` ${currency}`
    );
}

export function ArchivedAccounts({
    accounts,
}: Props) {
    const [selectedAccount, setSelectedAccount] =
        useState<AccountWithBalance | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    const [isPending, startTransition] =
        useTransition();

    if (accounts.length === 0) {
        return null;
    }

    function handleRestore() {
        if (!selectedAccount) {
            return;
        }

        setMessage(null);

        startTransition(async () => {
            const result =
                await restoreAccount(
                    selectedAccount.id
                );

            if (!result.success) {
                setMessage(
                    result.message ??
                    "The account could not be restored."
                );

                return;
            }

            setSelectedAccount(null);
        });
    }

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">
                    Archived accounts
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Hidden accounts that are no longer
                    available for new transactions.
                </p>
            </div>

            <Card className="overflow-hidden border-border/70">
                <CardContent className="divide-y p-0">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate font-medium">
                                        {account.name}
                                    </p>

                                    <Badge variant="secondary">
                                        {account.currency}
                                    </Badge>

                                    <Badge variant="outline">
                                        Archived
                                    </Badge>
                                </div>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Current balance:{" "}
                                    {formatBalance(
                                        Number(
                                            account.current_balance
                                        ),
                                        account.currency
                                    )}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setMessage(null);
                                    setSelectedAccount(
                                        account
                                    );
                                }}
                            >
                                <ArchiveRestore className="size-4" />
                                Restore
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Dialog
                open={selectedAccount !== null}
                onOpenChange={(open) => {
                    if (!open && !isPending) {
                        setSelectedAccount(null);
                        setMessage(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Restore account?
                        </DialogTitle>

                        <DialogDescription>
                            {selectedAccount?.name} will
                            appear again in Accounts and
                            can be selected for new
                            transactions.
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
                                setSelectedAccount(null)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            disabled={isPending}
                            onClick={handleRestore}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <ArchiveRestore className="size-4" />
                                    Restore account
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}