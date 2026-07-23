import {
    CircleDollarSign,
    PiggyBank,
    WalletCards,
} from "lucide-react";

import type { AccountSummary } from "@/features/accounts/utils/account-summary";
import { formatMoney } from "@/features/accounts/utils/account-summary";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type AccountsSummaryProps = {
    summary: AccountSummary;
};

type SummaryCardProps = {
    title: string;
    description: string;
    aedAmount: number;
    usdAmount: number;
    icon: typeof WalletCards;
};

function SummaryCard({
    title,
    description,
    aedAmount,
    usdAmount,
    icon: Icon,
}: SummaryCardProps) {
    return (
        <Card className="border-border/70">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>

                    <p className="text-xs text-muted-foreground/70">
                        {description}
                    </p>
                </div>

                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" />
                </div>
            </CardHeader>

            <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                    {formatMoney(aedAmount, "AED")}
                </p>

                <p className="text-sm text-muted-foreground">
                    {formatMoney(usdAmount, "USD")}
                </p>
            </CardContent>
        </Card>
    );
}

export function AccountsSummary({
    summary,
}: AccountsSummaryProps) {
    return (
        <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
                title="Available money"
                description="Money available for daily spending"
                aedAmount={summary.available.AED}
                usdAmount={summary.available.USD}
                icon={WalletCards}
            />

            <SummaryCard
                title="Savings"
                description="Money kept aside"
                aedAmount={summary.savings.AED}
                usdAmount={summary.savings.USD}
                icon={PiggyBank}
            />

            <SummaryCard
                title="Total balances"
                description="All active accounts"
                aedAmount={summary.total.AED}
                usdAmount={summary.total.USD}
                icon={CircleDollarSign}
            />
        </section>
    );
}