import {
    Banknote,
    Landmark,
    PiggyBank,
    WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { AccountDangerActions } from "@/features/accounts/components/account-danger-actions";
import { EditAccountDialog } from "@/features/accounts/components/edit-account-dialog";
import type { AccountWithBalance } from "@/features/accounts/types/account";

type AccountCardProps = {
    account: AccountWithBalance;
};

const accountTypeDetails = {
    bank: {
        label: "Bank account",
        icon: Landmark,
    },
    cash: {
        label: "Cash",
        icon: Banknote,
    },
    savings: {
        label: "Savings",
        icon: PiggyBank,
    },
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

export function AccountCard({
    account,
}: AccountCardProps) {
    const details =
        accountTypeDetails[account.type];

    const Icon = details.icon;

    return (
        <Card className="group overflow-hidden border-blue-500/15 bg-gradient-to-br from-blue-500/6 via-card to-transparent transition-colors hover:border-blue-500/35">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                        <CardTitle className="truncate text-base">
                            {account.name}
                        </CardTitle>

                        <p className="text-xs text-muted-foreground">
                            {details.label}
                        </p>
                    </div>
                </div>

                <Badge variant="secondary">
                    {account.currency}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-5">
                <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Current balance
                    </p>

                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {formatBalance(
                            Number(
                                account.current_balance
                            ),
                            account.currency
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <WalletCards className="size-3.5" />

                    {account
                        .is_included_in_available_balance
                        ? "Included in available money"
                        : "Excluded from available money"}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                    <EditAccountDialog
                        account={account}
                    />

                    <AccountDangerActions
                        accountId={account.id}
                        accountName={account.name}
                    />
                </div>
            </CardContent>
        </Card>
    );
}