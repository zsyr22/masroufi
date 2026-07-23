import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ReceiptText,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import { cn } from "@/lib/utils";
import { formatTransactionDate } from "@/features/transactions/utils/transaction-summary";
import { DeleteTransactionButton } from "@/features/transactions/components/delete-transaction-button";

function formatAmount(
  amount: number,
  currency: string,
  type: "income" | "expense"
) {
  const value = new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));

  return `${type === "income" ? "+" : "-"}${value} ${currency}`;
}

export default async function TransactionsPage() {
  const transactions = await getCurrentUserTransactions();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Review your income, expenses, stores, and payment history."
        action={
          <Link
            href="/transactions/new"
            className={cn(buttonVariants(), "gap-2")}
          >
            <Plus className="size-4" />
            Add transaction
          </Link>
        }
      />

      {transactions.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ReceiptText className="size-6" />
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              No transactions yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Add your first expense or income to begin tracking
              where your money goes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Transaction history
            </CardTitle>
          </CardHeader>

          <CardContent className="divide-y divide-border p-0">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const Icon = isIncome
                ? ArrowDownLeft
                : ArrowUpRight;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
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
                        {transaction.payees?.name ??
                          transaction.categories?.name ??
                          "Transaction"}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {transaction.categories?.name} ·{" "}
                        {transaction.accounts?.name} ·{" "}
                        {formatTransactionDate(transaction.transaction_date)}
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
                        {transaction.type}
                      </Badge>
                    </div>

                    <DeleteTransactionButton
                      transactionId={transaction.id}
                      transactionName={
                        transaction.payees?.name ??
                        transaction.categories?.name ??
                        "Transaction"
                      }
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}