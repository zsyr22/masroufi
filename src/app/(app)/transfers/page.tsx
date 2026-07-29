import Link from "next/link";
import {
    ArrowRight,
    ArrowRightLeft,
    Pencil,
    Plus,
} from "lucide-react";

import {
    buttonVariants,
} from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

import { DeleteTransferButton } from "@/features/transfers/components/delete-transfer-button";
import { getCurrentUserTransfers } from "@/features/transfers/services/transfer-service";

import { cn } from "@/lib/utils";

function formatCurrency(
    amount: number,
    currency: string
): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    ).format(
        new Date(`${date}T00:00:00`)
    );
}

export default async function TransfersPage() {
    const transfers =
        await getCurrentUserTransfers();

    return (
        <div className="space-y-8">
            <PageHeader
                title="Transfers"
                description="Move money between your accounts without affecting income or expenses."
                action={
                    <Link
                        href="/transfers/new"
                        className={buttonVariants()}
                    >
                        <Plus className="size-4" />
                        New transfer
                    </Link>
                }
            />

            {transfers.length === 0 ? (
                <Card className="border-cyan-500/15 bg-gradient-to-br from-cyan-500/6 via-card to-transparent">
                    <CardContent className="flex flex-col items-center px-6 py-14 text-center">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ArrowRightLeft className="size-5" />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold">
                            No transfers yet
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                            Transfers move money
                            between your accounts
                            without counting as income
                            or spending.
                        </p>

                        <Link
                            href="/transfers/new"
                            className={cn(
                                buttonVariants(),
                                "mt-5"
                            )}
                        >
                            <Plus className="size-4" />
                            Create transfer
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {transfers.map(
                        (transfer) => (
                            <Card
                                key={transfer.id}
                                size="sm"
                                className="border-cyan-500/15 bg-gradient-to-br from-cyan-500/6 via-card to-transparent"
                            >
                                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                            <span>
                                                {transfer
                                                    .from_account
                                                    ?.name ??
                                                    "Unknown account"}
                                            </span>

                                            <ArrowRight className="size-4 text-muted-foreground" />

                                            <span>
                                                {transfer
                                                    .to_account
                                                    ?.name ??
                                                    "Unknown account"}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatDate(
                                                transfer.transfer_date
                                            )}

                                            {transfer.notes
                                                ? ` · ${transfer.notes}`
                                                : ""}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:items-end">
                                        <p className="text-base font-semibold">
                                            {formatCurrency(
                                                Number(
                                                    transfer.amount
                                                ),
                                                transfer.currency
                                            )}
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={`/transfers/${transfer.id}/edit`}
                                                className={buttonVariants(
                                                    {
                                                        variant:
                                                            "outline",
                                                        size: "sm",
                                                    }
                                                )}
                                            >
                                                <Pencil className="size-4" />
                                                Edit
                                            </Link>

                                            <DeleteTransferButton
                                                transferId={
                                                    transfer.id
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    )}
                </div>
            )}
        </div>
    );
}