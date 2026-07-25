import {
    ArrowDownLeft,
    ArrowUpRight,
    CalendarDays,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TransactionDateGroupHeaderProps = {
    label: string;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    currency: string;
};

function formatAmount(amount: number) {
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function TransactionDateGroupHeader({
    label,
    totalIncome,
    totalExpenses,
    netAmount,
    currency,
}: TransactionDateGroupHeaderProps) {
    return (
        <div className="flex flex-col gap-3 border-b bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />

                <h3 className="text-sm font-semibold">
                    {label}
                </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {totalIncome > 0 ? (
                    <Badge
                        variant="secondary"
                        className="gap-1.5 text-primary"
                    >
                        <ArrowDownLeft className="size-3" />
                        Income: {formatAmount(totalIncome)}{" "}
                        {currency}
                    </Badge>
                ) : null}

                {totalExpenses > 0 ? (
                    <Badge
                        variant="secondary"
                        className="gap-1.5 text-destructive"
                    >
                        <ArrowUpRight className="size-3" />
                        Spent: {formatAmount(totalExpenses)}{" "}
                        {currency}
                    </Badge>
                ) : null}

                <Badge
                    variant="outline"
                    className={cn(
                        "gap-1.5",
                        netAmount > 0 && "text-primary",
                        netAmount < 0 && "text-destructive"
                    )}
                >
                    Net: {netAmount > 0 ? "+" : ""}
                    {formatAmount(netAmount)} {currency}
                </Badge>
            </div>
        </div>
    );
}