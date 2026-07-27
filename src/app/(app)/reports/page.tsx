import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  ReceiptText,
  Repeat2,
  Scale,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatMoney } from "@/features/accounts/utils/account-summary";
import { MonthlyComparisonCard } from "@/features/reports/components/monthly-comparison-card";
import { ReportBreakdownCard } from "@/features/reports/components/report-breakdown-card";
import {
  calculateAccountBreakdown,
  calculateCategoryBreakdown,
  calculateMonthlyComparison,
  calculateReportsSummary,
  calculateSubscriptionReportSummary,
  formatReportDate,
  getCurrentMonthLabel,
  getLargestExpenses,
} from "@/features/reports/utils/report-utils";
import { getCurrentUserSubscriptions } from "@/features/subscriptions/services/subscription-service";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import { getTransactionDisplayTitle } from "@/features/transactions/utils/transaction-display";

export default async function ReportsPage() {
  const [transactions, subscriptions] =
    await Promise.all([
      getCurrentUserTransactions(),
      getCurrentUserSubscriptions(),
    ]);

  const summary =
    calculateReportsSummary(
      transactions
    );

  const categoryBreakdown =
    calculateCategoryBreakdown(
      transactions
    );

  const accountBreakdown =
    calculateAccountBreakdown(
      transactions
    );

  const monthlyComparison =
    calculateMonthlyComparison(
      transactions
    );

  const largestExpenses =
    getLargestExpenses(
      transactions
    );

  const subscriptionSummary =
    calculateSubscriptionReportSummary(
      subscriptions
    );

  const currentMonthLabel =
    getCurrentMonthLabel();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description={`Financial analysis for ${currentMonthLabel}.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Monthly income"
          value={formatMoney(
            summary.income.AED,
            "AED"
          )}
          description={`${formatMoney(
            summary.income.USD,
            "USD"
          )} income`}
          icon={ArrowDownLeft}
          tone="success"
        />

        <StatCard
          title="Monthly expenses"
          value={formatMoney(
            summary.expenses.AED,
            "AED"
          )}
          description={`${formatMoney(
            summary.expenses.USD,
            "USD"
          )} expenses`}
          icon={ArrowUpRight}
          tone="danger"
        />

        <StatCard
          title="Monthly net"
          value={formatMoney(
            summary.net.AED,
            "AED"
          )}
          description={`${formatMoney(
            summary.net.USD,
            "USD"
          )} net`}
          icon={Scale}
          tone={
            summary.net.AED >= 0
              ? "success"
              : "danger"
          }
        />

        <StatCard
          title="Daily expense average"
          value={formatMoney(
            summary.averageDailyExpenses
              .AED,
            "AED"
          )}
          description={`${summary.transactionCount} transactions this month`}
          icon={CalendarDays}
        />
      </section>

      <section>
        <MonthlyComparisonCard
          months={monthlyComparison}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ReportBreakdownCard
          title="Expenses by category"
          description="Where your money went this month."
          items={categoryBreakdown}
        />

        <ReportBreakdownCard
          title="Expenses by account"
          description="Which accounts were used for spending."
          items={accountBreakdown}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4 text-primary" />
              Largest expenses
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Your five largest expenses
              this month.
            </p>
          </CardHeader>

          <CardContent>
            {largestExpenses.length ===
              0 ? (
              <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed px-5 text-center">
                <p className="text-sm text-muted-foreground">
                  No expenses recorded this
                  month.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {largestExpenses.map(
                  (
                    transaction,
                    index
                  ) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {getTransactionDisplayTitle(
                              transaction
                            )}
                          </p>

                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {transaction
                              .categories
                              ?.name ??
                              "Uncategorized"}
                            {" · "}
                            {formatReportDate(
                              transaction.transaction_date
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {formatMoney(
                          Number(
                            transaction.amount
                          ),
                          transaction.currency
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Repeat2 className="size-4 text-primary" />
              Subscription commitments
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Estimated recurring
              commitments.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">
                Active subscriptions
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {
                  subscriptionSummary.activeCount
                }
              </p>
            </div>

            <div className="rounded-xl border bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">
                Monthly equivalent
              </p>

              <p className="mt-2 font-semibold">
                {formatMoney(
                  subscriptionSummary
                    .monthly.AED,
                  "AED"
                )}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatMoney(
                  subscriptionSummary
                    .monthly.USD,
                  "USD"
                )}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">
                Estimated yearly
              </p>

              <p className="mt-2 font-semibold">
                {formatMoney(
                  subscriptionSummary
                    .yearly.AED,
                  "AED"
                )}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatMoney(
                  subscriptionSummary
                    .yearly.USD,
                  "USD"
                )}
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4">
              <ChartNoAxesCombined className="mt-0.5 size-4 shrink-0 text-primary" />

              <p className="text-xs leading-5 text-muted-foreground">
                One-time subscriptions are
                excluded from recurring
                monthly and yearly estimates.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}