import {
    ArrowDownLeft,
    ArrowUpRight,
    Scale,
} from "lucide-react";

import type { TransactionListItem } from "@/features/transactions/services/transaction-service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TransactionFilterSummaryProps = {
    transactions: TransactionListItem[];
};

function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function TransactionFilterSummary({
    transactions,
}: TransactionFilterSummaryProps) {
    const totalIncome = transactions
        .filter(
            (transaction) =>
                transaction.type === "income"
        )
        .reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );

    const totalExpenses = transactions
        .filter(
            (transaction) =>
                transaction.type === "expense"
        )
        .reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );

    const netAmount =
        totalIncome - totalExpenses;

    const currency =
        transactions[0]?.currency ?? "AED";

    const items = [
        {
            label: "Income",
            value: totalIncome,
            icon: ArrowDownLeft,
            className:
                "bg-primary/10 text-primary",
        },
        {
            label: "Expenses",
            value: totalExpenses,
            icon: ArrowUpRight,
            className:
                "bg-destructive/10 text-destructive",
        },
        {
            label: "Net cash flow",
            value: netAmount,
            icon: Scale,
            className:
                "bg-muted text-muted-foreground",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <Card key={item.label} className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/6 via-card to-transparent">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div
                                className={cn(
                                    "flex size-10 items-center justify-center rounded-xl",
                                    item.className
                                )}
                            >
                                <Icon className="size-4" />
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    {item.label}
                                </p>

                                <p className="mt-1 text-lg font-semibold">
                                    {formatAmount(
                                        item.value
                                    )}{" "}
                                    {currency}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}