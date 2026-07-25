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
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { DeleteTransactionButton } from "@/features/transactions/components/delete-transaction-button";
import { EditTransactionButton } from "@/features/transactions/components/edit-transaction-button";
import { TransactionFilterSummary } from "@/features/transactions/components/transaction-filter-summary";
import { TransactionFilters } from "@/features/transactions/components/transaction-filters";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import type { TransactionType } from "@/features/transactions/types/transaction";
import { cn } from "@/lib/utils";
import { TransactionDateGroupHeader } from "@/features/transactions/components/transaction-date-group-header";
import { groupTransactionsByDate } from "@/features/transactions/utils/group-transactions-by-date";

type TransactionsPageProps = {
  searchParams: Promise<{
    date?: string;
    type?: string;
    account?: string;
  }>;
};

function formatAmount(
  amount: number,
  currency: string,
  type: TransactionType
) {
  const value = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));

  return `${type === "income" ? "+" : "-"}${value} ${currency}`;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;

  const date = params.date ?? "";

  const type: TransactionType | "all" =
    params.type === "income" ||
      params.type === "expense"
      ? params.type
      : "all";

  const accountId = params.account ?? "";

  const [transactions, accounts] = await Promise.all([
    getCurrentUserTransactions({
      date: date || undefined,
      type,
      accountId: accountId || undefined,
    }),
    getCurrentUserAccounts(),
  ]);

  const hasActiveFilters =
    Boolean(date) ||
    type !== "all" ||
    Boolean(accountId);

  const transactionGroups =
    groupTransactionsByDate(transactions);

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

      <TransactionFilters
        accounts={accounts}
        date={date}
        type={type}
        accountId={accountId}
      />

      <TransactionFilterSummary transactions={transactions} />

      {transactions.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ReceiptText className="size-6" />
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              {hasActiveFilters
                ? "No matching transactions"
                : "No transactions yet"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {hasActiveFilters
                ? "Try changing or clearing the selected filters."
                : "Add your first expense or income to begin tracking where your money goes."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              Transaction history
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {transactionGroups.map((group) => {
              const currency =
                group.transactions[0]?.currency ?? "AED";

              return (
                <section
                  key={group.date}
                  className="border-t first:border-t-0"
                >
                  <TransactionDateGroupHeader
                    label={group.label}
                    totalIncome={group.totalIncome}
                    totalExpenses={group.totalExpenses}
                    netAmount={group.netAmount}
                    currency={currency}
                  />

                  <div className="divide-y divide-border">
                    {group.transactions.map(
                      (transaction) => {
                        const isIncome =
                          transaction.type ===
                          "income";

                        const Icon = isIncome
                          ? ArrowDownLeft
                          : ArrowUpRight;

                        const transactionName =
                          transaction.payees
                            ?.name ??
                          transaction.categories
                            ?.name ??
                          "Transaction";

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
                                  {
                                    transactionName
                                  }
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
                                  transactionName={
                                    transactionName
                                  }
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
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}