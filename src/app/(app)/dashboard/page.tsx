import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import {
  calculateAccountSummary,
  formatMoney,
} from "@/features/accounts/utils/account-summary";

import { DashboardPeopleBalances } from "@/features/people/components/dashboard-people-balances";
import { getCurrentUserPeopleBalances } from "@/features/people/services/people-service";

import { DeleteTransactionButton } from "@/features/transactions/components/delete-transaction-button";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import {
  calculateMonthlyTransactionSummary,
  formatTransactionDate,
} from "@/features/transactions/utils/transaction-summary";

import { cn } from "@/lib/utils";
import { getTransactionDisplayTitle } from "@/features/transactions/utils/transaction-display";
import { DashboardSubscriptions } from "@/features/dashboard/components/dashboard-subscriptions";
import { getCurrentUserSubscriptions } from "@/features/subscriptions/services/subscription-service";

export default async function DashboardPage() {
  const [
    accounts,
    transactions,
    people,
    subscriptions,
  ] = await Promise.all([
    getCurrentUserAccounts(),
    getCurrentUserTransactions(),
    getCurrentUserPeopleBalances(),
    getCurrentUserSubscriptions(),
  ]);

  const accountSummary =
    calculateAccountSummary(accounts);

  const transactionSummary =
    calculateMonthlyTransactionSummary(
      transactions
    );

  const recentTransactions =
    transactions.slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="A clear overview of your money and recent financial activity."
        action={
          <Link
            href="/transactions/new"
            className={cn(
              buttonVariants(),
              "gap-2"
            )}
          >
            <Plus className="size-4" />
            Add transaction
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available money"
          value={formatMoney(
            accountSummary.available.AED,
            "AED"
          )}
          description={`${formatMoney(
            accountSummary.available.USD,
            "USD"
          )} also available`}
          icon={Wallet}
        />

        <StatCard
          title="Savings"
          value={formatMoney(
            accountSummary.savings.AED,
            "AED"
          )}
          description={`${formatMoney(
            accountSummary.savings.USD,
            "USD"
          )} saved`}
          icon={PiggyBank}
          tone="success"
        />

        <StatCard
          title="This month income"
          value={formatMoney(
            transactionSummary.income.AED,
            "AED"
          )}
          description={`${formatMoney(
            transactionSummary.income.USD,
            "USD"
          )} income`}
          icon={ArrowDownLeft}
          tone="success"
        />

        <StatCard
          title="This month expenses"
          value={formatMoney(
            transactionSummary.expenses.AED,
            "AED"
          )}
          description={`${formatMoney(
            transactionSummary.expenses.USD,
            "USD"
          )} expenses`}
          icon={ArrowUpRight}
          tone="danger"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Recent transactions
            </CardTitle>
          </CardHeader>

          <CardContent className="p-2">
            {recentTransactions.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <ReceiptText className="size-5" />
                </div>

                <h2 className="mt-4 text-sm font-semibold">
                  No transactions yet
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Your latest income and expenses
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map(
                  (transaction) => {
                    const isIncome =
                      transaction.type ===
                      "income";

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-muted/40"
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
                            {isIncome ? (
                              <ArrowDownLeft className="size-4" />
                            ) : (
                              <ArrowUpRight className="size-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {getTransactionDisplayTitle(
                                transaction
                              )}
                            </p>

                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {transaction.categories?.name} ·{" "}
                              {transaction.accounts?.name} ·{" "}
                              {formatTransactionDate(
                                transaction.transaction_date
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              isIncome
                                ? "text-primary"
                                : "text-foreground"
                            )}
                          >
                            {isIncome ? "+" : "-"}
                            {formatMoney(
                              Number(
                                transaction.amount
                              ),
                              transaction.currency
                            )}
                          </p>

                          <DeleteTransactionButton
                            transactionId={
                              transaction.id
                            }
                            transactionName={
                              getTransactionDisplayTitle(
                                transaction
                              )
                            }
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <DashboardPeopleBalances
          people={people}
        />
      </section>

      <section>
        <DashboardSubscriptions
          subscriptions={subscriptions}
        />
      </section>


    </div>
  );
}