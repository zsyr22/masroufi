import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { formatMoney } from "@/features/accounts/utils/account-summary";
import type { MonthlyReportItem } from "@/features/reports/utils/report-utils";

type MonthlyComparisonCardProps = {
    months: MonthlyReportItem[];
};

export function MonthlyComparisonCard({
    months,
}: MonthlyComparisonCardProps) {
    const maximumAedValue = Math.max(
        ...months.flatMap((month) => [
            month.income.AED,
            month.expenses.AED,
        ]),
        1
    );

    return (
        <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/6 via-card to-transparent">
            <CardHeader>
                <CardTitle className="text-base">
                    Last 6 months
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                    Income and expenses in AED.
                </p>
            </CardHeader>

            <CardContent>
                <div className="flex min-h-72 items-end gap-4 overflow-x-auto pb-2">
                    {months.map((month) => {
                        const incomeHeight =
                            (month.income.AED /
                                maximumAedValue) *
                            100;

                        const expenseHeight =
                            (month.expenses.AED /
                                maximumAedValue) *
                            100;

                        return (
                            <div
                                key={month.monthKey}
                                className="flex min-w-24 flex-1 flex-col"
                            >
                                <div className="flex h-48 items-end justify-center gap-2">
                                    <div
                                        title={`Income: ${formatMoney(
                                            month.income.AED,
                                            "AED"
                                        )}`}
                                        className="w-6 rounded-t-md bg-primary/70"
                                        style={{
                                            height: `${Math.max(
                                                incomeHeight,
                                                month.income.AED > 0
                                                    ? 4
                                                    : 0
                                            )}%`,
                                        }}
                                    />

                                    <div
                                        title={`Expenses: ${formatMoney(
                                            month.expenses.AED,
                                            "AED"
                                        )}`}
                                        className="w-6 rounded-t-md bg-destructive/70"
                                        style={{
                                            height: `${Math.max(
                                                expenseHeight,
                                                month.expenses.AED > 0
                                                    ? 4
                                                    : 0
                                            )}%`,
                                        }}
                                    />
                                </div>

                                <div className="mt-3 border-t pt-3 text-center">
                                    <p className="text-xs font-medium">
                                        {month.monthLabel}
                                    </p>

                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        Net{" "}
                                        {formatMoney(
                                            month.net.AED,
                                            "AED"
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-5 border-t pt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-sm bg-primary/70" />
                        Income
                    </span>

                    <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-sm bg-destructive/70" />
                        Expenses
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}