import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { formatMoney } from "@/features/accounts/utils/account-summary";
import type { ReportBreakdownItem } from "@/features/reports/utils/report-utils";

type ReportBreakdownCardProps = {
    title: string;
    description: string;
    items: ReportBreakdownItem[];
};

function calculatePercentage(
    amount: number,
    maximumAmount: number
): number {
    if (maximumAmount <= 0) {
        return 0;
    }

    return Math.max(
        4,
        Math.min(
            100,
            (amount / maximumAmount) * 100
        )
    );
}

export function ReportBreakdownCard({
    title,
    description,
    items,
}: ReportBreakdownCardProps) {
    const maximumAedAmount = Math.max(
        ...items.map(
            (item) => item.amount.AED
        ),
        0
    );

    const maximumUsdAmount = Math.max(
        ...items.map(
            (item) => item.amount.USD
        ),
        0
    );

    return (
        <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/6 via-card to-transparent">
            <CardHeader>
                <CardTitle className="text-base">
                    {title}
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </CardHeader>

            <CardContent>
                {items.length === 0 ? (
                    <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed px-5 text-center">
                        <p className="text-sm text-muted-foreground">
                            No expense data available for
                            this month.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {items.map((item) => {
                            const primaryCurrency =
                                item.amount.AED > 0
                                    ? "AED"
                                    : "USD";

                            const primaryAmount =
                                item.amount[
                                primaryCurrency
                                ];

                            const maximumAmount =
                                primaryCurrency === "AED"
                                    ? maximumAedAmount
                                    : maximumUsdAmount;

                            const percentage =
                                calculatePercentage(
                                    primaryAmount,
                                    maximumAmount
                                );

                            return (
                                <div
                                    key={item.id}
                                    className="space-y-2"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {item.name}
                                            </p>

                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {
                                                    item.transactionCount
                                                }{" "}
                                                {item.transactionCount ===
                                                    1
                                                    ? "transaction"
                                                    : "transactions"}
                                            </p>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            {item.amount.AED >
                                                0 ? (
                                                <p className="text-sm font-semibold">
                                                    {formatMoney(
                                                        item.amount.AED,
                                                        "AED"
                                                    )}
                                                </p>
                                            ) : null}

                                            {item.amount.USD >
                                                0 ? (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatMoney(
                                                        item.amount.USD,
                                                        "USD"
                                                    )}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                                width: `${percentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}