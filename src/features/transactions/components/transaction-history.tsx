"use client";

import {
    useMemo,
    useState,
    useTransition,
} from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckSquare2,
    Loader2,
    Trash2,
    X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteTransactions } from "@/features/transactions/actions/transaction-actions";
import { DeleteTransactionButton } from "@/features/transactions/components/delete-transaction-button";
import { EditTransactionButton } from "@/features/transactions/components/edit-transaction-button";
import { TransactionDateGroupHeader } from "@/features/transactions/components/transaction-date-group-header";
import type { TransactionListItem } from "@/features/transactions/services/transaction-service";
import type { TransactionType } from "@/features/transactions/types/transaction";
import { getTransactionDisplayTitle } from "@/features/transactions/utils/transaction-display";
import { groupTransactionsByDate } from "@/features/transactions/utils/group-transactions-by-date";
import { cn } from "@/lib/utils";
import { TransactionPagination } from "@/features/transactions/components/transaction-pagination";

type TransactionHistoryProps = {
    transactions: TransactionListItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
};

function formatAmount(
    amount: number,
    currency: string,
    type: TransactionType
): string {
    const value = new Intl.NumberFormat(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    ).format(Number(amount));

    return `${type === "income" ? "+" : "-"
        }${value} ${currency}`;
}

export function TransactionHistory({
    transactions,
    page,
    pageSize,
    totalCount,
    totalPages,
}: TransactionHistoryProps) {
    const [selectedIds, setSelectedIds] =
        useState<Set<string>>(
            () => new Set()
        );

    const [
        confirmationOpen,
        setConfirmationOpen,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState<string>();

    const [isPending, startTransition] =
        useTransition();

    const transactionGroups = useMemo(
        () =>
            groupTransactionsByDate(
                transactions
            ),
        [transactions]
    );

    const allTransactionIds = useMemo(
        () =>
            transactions.map(
                (transaction) =>
                    transaction.id
            ),
        [transactions]
    );

    const allSelected =
        allTransactionIds.length > 0 &&
        allTransactionIds.every((id) =>
            selectedIds.has(id)
        );

    const someSelected =
        selectedIds.size > 0;

    function toggleTransaction(
        transactionId: string
    ) {
        setSelectedIds((current) => {
            const next = new Set(current);

            if (next.has(transactionId)) {
                next.delete(transactionId);
            } else {
                next.add(transactionId);
            }

            return next;
        });
    }

    function toggleAll() {
        setSelectedIds(() => {
            if (allSelected) {
                return new Set();
            }

            return new Set(
                allTransactionIds
            );
        });
    }

    function clearSelection() {
        setSelectedIds(new Set());
        setErrorMessage(undefined);
    }

    function handleBulkDelete() {
        const ids = Array.from(
            selectedIds
        );

        if (ids.length === 0) {
            return;
        }

        setErrorMessage(undefined);

        startTransition(async () => {
            const result =
                await deleteTransactions(
                    ids
                );

            if (!result.success) {
                setErrorMessage(
                    result.message ??
                    "The selected transactions could not be deleted."
                );

                return;
            }

            setSelectedIds(new Set());
            setConfirmationOpen(false);
        });
    }

    return (
        <>
            <Card className="overflow-hidden">
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base">
                                Transaction history
                            </CardTitle>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Select multiple
                                transactions to manage
                                them together.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={toggleAll}
                            disabled={
                                isPending ||
                                transactions.length ===
                                0
                            }
                            className="gap-2"
                        >
                            <CheckSquare2 className="size-4" />

                            {allSelected
                                ? "Deselect all"
                                : "Select all"}
                        </Button>
                    </div>

                    {someSelected ? (
                        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-medium">
                                {selectedIds.size}{" "}
                                {selectedIds.size ===
                                    1
                                    ? "transaction selected"
                                    : "transactions selected"}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={
                                        clearSelection
                                    }
                                    disabled={
                                        isPending
                                    }
                                >
                                    <X className="size-4" />
                                    Clear
                                </Button>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                        setConfirmationOpen(
                                            true
                                        )
                                    }
                                    disabled={
                                        isPending
                                    }
                                >
                                    <Trash2 className="size-4" />
                                    Delete selected
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </CardHeader>

                <CardContent className="p-0">
                    {transactionGroups.map(
                        (group) => {
                            const currency =
                                group.transactions[0]
                                    ?.currency ??
                                "AED";

                            return (
                                <section
                                    key={
                                        group.date
                                    }
                                    className="border-t first:border-t-0"
                                >
                                    <TransactionDateGroupHeader
                                        label={
                                            group.label
                                        }
                                        totalIncome={
                                            group.totalIncome
                                        }
                                        totalExpenses={
                                            group.totalExpenses
                                        }
                                        netAmount={
                                            group.netAmount
                                        }
                                        currency={
                                            currency
                                        }
                                    />

                                    <div className="divide-y divide-border">
                                        {group.transactions.map(
                                            (
                                                transaction
                                            ) => {
                                                const isIncome =
                                                    transaction.type ===
                                                    "income";

                                                const Icon =
                                                    isIncome
                                                        ? ArrowDownLeft
                                                        : ArrowUpRight;

                                                const transactionName =
                                                    transaction
                                                        .payees
                                                        ?.name ??
                                                    transaction
                                                        .categories
                                                        ?.name ??
                                                    "Transaction";

                                                const isSelected =
                                                    selectedIds.has(
                                                        transaction.id
                                                    );

                                                return (
                                                    <div
                                                        key={
                                                            transaction.id
                                                        }
                                                        className={cn(
                                                            "flex items-center justify-between gap-4 px-6 py-4 transition-colors",
                                                            isSelected
                                                                ? "bg-primary/5"
                                                                : "hover:bg-muted/30"
                                                        )}
                                                    >
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    isSelected
                                                                }
                                                                onChange={() =>
                                                                    toggleTransaction(
                                                                        transaction.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    isPending
                                                                }
                                                                aria-label={`Select ${getTransactionDisplayTitle(
                                                                    transaction
                                                                )}`}
                                                                className="size-4 shrink-0 cursor-pointer accent-current"
                                                            />

                                                            <div
                                                                className={cn(
                                                                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                                                                    isIncome
                                                                        ? "bg-primary/10 text-primary"
                                                                        : "bg-destructive/10 text-destructive"
                                                                )}
                                                            >
                                                                <Icon className="size-4" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium">
                                                                    {getTransactionDisplayTitle(
                                                                        transaction
                                                                    )}
                                                                </p>

                                                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                                                    {transaction
                                                                        .categories
                                                                        ?.name ??
                                                                        "No category"}{" "}
                                                                    ·{" "}
                                                                    {transaction
                                                                        .accounts
                                                                        ?.name ??
                                                                        "No account"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0 items-center gap-3">
                                                            <div className="text-right">
                                                                <p
                                                                    className={cn(
                                                                        "text-sm font-semibold",
                                                                        isIncome
                                                                            ? "text-primary"
                                                                            : "text-foreground"
                                                                    )}
                                                                >
                                                                    {formatAmount(
                                                                        transaction.amount,
                                                                        transaction.currency,
                                                                        transaction.type
                                                                    )}
                                                                </p>

                                                                <Badge
                                                                    variant="secondary"
                                                                    className="mt-1 capitalize"
                                                                >
                                                                    {
                                                                        transaction.type
                                                                    }
                                                                </Badge>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <EditTransactionButton
                                                                    transactionId={
                                                                        transaction.id
                                                                    }
                                                                    transactionName={
                                                                        transactionName
                                                                    }
                                                                />

                                                                <DeleteTransactionButton
                                                                    transactionId={
                                                                        transaction.id
                                                                    }
                                                                    transactionName={getTransactionDisplayTitle(
                                                                        transaction
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </section>
                            );
                        }
                    )}
                    <TransactionPagination
                        page={page}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        totalPages={totalPages}
                    />
                </CardContent>
            </Card>

            <AlertDialog
                open={confirmationOpen}
                onOpenChange={
                    setConfirmationOpen
                }
            >
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete selected
                            transactions?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            You are about to
                            permanently delete{" "}
                            {selectedIds.size}{" "}
                            {selectedIds.size ===
                                1
                                ? "transaction"
                                : "transactions"}
                            . Account balances,
                            people balances,
                            dashboard totals and
                            reports will be
                            recalculated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {errorMessage ? (
                        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {errorMessage}
                        </p>
                    ) : null}

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={
                                isPending
                            }
                        >
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            type="button"
                            onClick={
                                handleBulkDelete
                            }
                            disabled={
                                isPending ||
                                selectedIds.size ===
                                0
                            }
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
                                    Delete{" "}
                                    {
                                        selectedIds.size
                                    }
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}