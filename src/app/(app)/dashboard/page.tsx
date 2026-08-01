import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  CircleDollarSign,
  Gauge,
  Lightbulb,
  PiggyBank,
  ReceiptText,
  ShoppingBasket,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import {
  calculateAccountSummary,
  formatMoney,
} from "@/features/accounts/utils/account-summary";
import { getDashboardBillsData } from "@/features/bills/services/bill-service";
import { DashboardBills } from "@/features/dashboard/components/dashboard-bills";
import { DashboardSubscriptions } from "@/features/dashboard/components/dashboard-subscriptions";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { getFuelEntries } from "@/features/fuel/services/fuel-service";
import { fuelTypeLabels } from "@/features/fuel/types/fuel";
import { DashboardPeopleBalances } from "@/features/people/components/dashboard-people-balances";
import { getCurrentUserPeopleBalances } from "@/features/people/services/people-service";
import { getCurrentUserPurchases } from "@/features/purchases/services/purchase-service";
import {
  calculateCategoryBreakdown,
  calculateReportsSummary,
} from "@/features/reports/utils/report-utils";
import { getCurrentUserSubscriptions } from "@/features/subscriptions/services/subscription-service";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import { getTransactionDisplayTitle } from "@/features/transactions/utils/transaction-display";
import { formatTransactionDate } from "@/features/transactions/utils/transaction-summary";
import { cn } from "@/lib/utils";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [
    accounts,
    transactionResult,
    people,
    subscriptions,
    dashboardBills,
    purchases,
    fuelEntries,
  ] = await Promise.all([
    getCurrentUserAccounts(),
    getCurrentUserTransactions({ pageSize: 100 }),
    getCurrentUserPeopleBalances(),
    getCurrentUserSubscriptions(),
    getDashboardBillsData(),
    getCurrentUserPurchases(),
    getFuelEntries(),
  ]);

  const transactions = transactionResult.transactions;
  const accountSummary = calculateAccountSummary(accounts);
  const summary = calculateReportsSummary(transactions);
  const categoryBreakdown = calculateCategoryBreakdown(transactions);
  const topCategory = categoryBreakdown[0];
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthPurchases = purchases.filter((purchase) =>
    purchase.purchase_date.startsWith(currentMonth)
  );
  const purchaseTotal = monthPurchases.reduce(
    (total, purchase) =>
      total + (purchase.currency === "AED" ? Number(purchase.total) : 0),
    0
  );
  const storeTotals = monthPurchases.reduce<Record<string, number>>(
    (result, purchase) => {
      const storeName = purchase.stores?.name ?? "Unknown store";
      result[storeName] =
        (result[storeName] ?? 0) +
        (purchase.currency === "AED" ? Number(purchase.total) : 0);
      return result;
    },
    {}
  );
  const topStore = Object.entries(storeTotals).sort((a, b) => b[1] - a[1])[0];
  const latestPurchase = monthPurchases[0];
  const savingsRate =
    summary.income.AED > 0
      ? Math.max(0, (summary.net.AED / summary.income.AED) * 100)
      : 0;
  const recentTransactions = transactions.slice(0, 6);

  const monthFuel = fuelEntries.filter((entry) =>
    entry.fuel_date.startsWith(currentMonth)
  );
  const fuelSpend = monthFuel.reduce(
    (total, entry) =>
      total + (entry.currency === "AED" ? Number(entry.total) : 0),
    0
  );
  const fuelLiters = monthFuel.reduce(
    (total, entry) => total + Number(entry.liters),
    0
  );
  const averageFuelPrice =
    fuelLiters > 0 ? fuelSpend / fuelLiters : 0;
  const latestFuel = fuelEntries[0];

  const insight =
    summary.transactionCount === 0
      ? "Start recording transactions to unlock useful monthly insights."
      : summary.net.AED < 0
        ? `Spending is ${formatMoney(Math.abs(summary.net.AED), "AED")} above income this month.`
        : topCategory
          ? `${topCategory.name} is currently your largest spending category at ${formatMoney(topCategory.amount.AED, "AED")}.`
          : `You kept ${savingsRate.toFixed(0)}% of your recorded income this month.`;

  return (
    <div className="space-y-8 pb-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-500/15 bg-gradient-to-br from-emerald-500/14 via-card to-violet-500/10 px-6 py-7 shadow-[0_20px_70px_-52px_rgba(16,185,129,0.5)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-emerald-500/7 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-64 rounded-full bg-violet-500/7 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
              <Sparkles className="size-3.5" /> Financial overview
            </div>
            <p className="mt-5 text-sm font-medium text-muted-foreground">
              {getGreeting()}, Ziad 👋
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your money, beautifully organized.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Balances, spending, commitments and everything that needs your
              attention — in one calm control room.
            </p>
          </div>

          {/* <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[410px]">
            <div className="rounded-2xl border border-white/10 bg-background/40 p-4 shadow-sm backdrop-blur-xl">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="size-3.5 text-emerald-500" /> Available now
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMoney(accountSummary.available.AED, "AED")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Across included spending accounts
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/40 p-4 shadow-sm backdrop-blur-xl">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5 text-violet-500" /> This month net
              </p>
              <p
                className={cn(
                  "mt-2 text-2xl font-semibold",
                  summary.net.AED >= 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {formatMoney(summary.net.AED, "AED")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Income minus recorded expenses
              </p>
            </div>
          </div> */}
        </div>
      </section>

      <QuickActions />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available money"
          value={formatMoney(accountSummary.available.AED, "AED")}
          description={`${formatMoney(accountSummary.available.USD, "USD")} also available`}
          icon={Wallet}
        />
        <StatCard
          title="This month net"
          value={formatMoney(summary.net.AED, "AED")}
          description={`${summary.income.AED > 0 ? savingsRate.toFixed(0) : "0"}% of income kept`}
          icon={Target}
          tone={summary.net.AED >= 0 ? "success" : "danger"}
        />
        <StatCard
          title="This month income"
          value={formatMoney(summary.income.AED, "AED")}
          description={`${formatMoney(summary.income.USD, "USD")} income`}
          icon={ArrowDownLeft}
          tone="success"
        />
        <StatCard
          title="This month expenses"
          value={formatMoney(summary.expenses.AED, "AED")}
          description={`${summary.transactionCount} recorded transactions`}
          icon={ArrowUpRight}
          tone="danger"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="group relative overflow-hidden border-amber-500/15 bg-gradient-to-br from-amber-500/10 via-card to-transparent shadow-[0_28px_90px_-55px_rgba(245,158,11,0.8)] xl:col-span-2">
          <div className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-amber-500/10 blur-3xl" />
          <CardHeader className="relative flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBasket className="size-4 text-amber-500" /> Purchase activity
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Receipts and itemized shopping this month.
              </p>
            </div>
            <Link
              href="/purchases"
              className="flex items-center gap-1 text-xs font-medium text-amber-600 transition hover:gap-2"
            >
              View purchases <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Receipts", String(monthPurchases.length), "This month"],
                ["Purchase spend", formatMoney(purchaseTotal, "AED"), "Itemized receipts"],
                ["Top store", topStore?.[0] ?? "—", topStore ? formatMoney(topStore[1], "AED") : "No purchases yet"],
                ["Top category", topCategory?.name ?? "—", topCategory ? formatMoney(topCategory.amount.AED, "AED") : "No spending yet"],
              ].map(([label, value, detail]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-amber-500/15 bg-background/45 p-4 backdrop-blur transition duration-300 group-hover:border-amber-500/20"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 truncate text-lg font-semibold">{value}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
            {latestPurchase ? (
              <Link
                href={`/purchases/${latestPurchase.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/12 bg-amber-500/5 px-4 py-3 transition hover:bg-amber-500/8"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Latest receipt</p>
                  <p className="mt-1 truncate text-sm font-medium">
                    {latestPurchase.stores?.name ?? "Purchase"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {formatMoney(Number(latestPurchase.total), latestPurchase.currency)}
                </p>
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 via-card to-transparent shadow-[0_28px_90px_-55px_rgba(16,185,129,0.8)]">
          <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="size-4 text-emerald-500" /> Savings position
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-3xl font-semibold">
              {formatMoney(accountSummary.savings.AED, "AED")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Dedicated savings accounts
            </p>
            <div className="mt-6 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Monthly retention</span>
              <span className="font-semibold text-emerald-500">
                {savingsRate.toFixed(0)}%
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${Math.min(100, savingsRate)}%` }}
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {summary.income.AED > 0
                ? `${formatMoney(Math.max(0, summary.net.AED), "AED")} retained from recorded income.`
                : "Record income to calculate your monthly retention rate."}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="relative overflow-hidden border-cyan-500/15 bg-gradient-to-br from-cyan-500/10 via-card to-transparent shadow-[0_28px_90px_-55px_rgba(6,182,212,0.75)]">
          <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-cyan-500/10 blur-3xl" />
          <CardHeader className="relative flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CarFront className="size-4 text-cyan-500" /> Fuel
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Driving spend this month.</p>
            </div>
            <Link href="/fuel" className="text-xs font-medium text-cyan-500 hover:underline">
              Open fuel
            </Link>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cyan-500/15 bg-background/45 p-4">
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="mt-2 text-xl font-semibold">{formatMoney(fuelSpend, "AED")}</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/15 bg-background/45 p-4">
                <p className="text-xs text-muted-foreground">Liters</p>
                <p className="mt-2 text-xl font-semibold">{fuelLiters.toFixed(1)} L</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-cyan-500/12 bg-cyan-500/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Gauge className="size-4" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Average price</p>
                  <p className="mt-0.5 text-sm font-semibold">{averageFuelPrice.toFixed(2)} AED/L</p>
                </div>
              </div>
              <div className="max-w-[45%] text-right">
                <p className="truncate text-xs font-medium">{latestFuel?.station_name ?? "No fill-ups"}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {latestFuel ? fuelTypeLabels[latestFuel.fuel_type] : "Add your first entry"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DashboardBills data={dashboardBills} />

        <Card className="relative overflow-hidden border-violet-500/15 bg-gradient-to-br from-violet-500/10 via-card to-transparent shadow-[0_28px_90px_-55px_rgba(139,92,246,0.75)]">
          <div className="pointer-events-none absolute -right-14 -top-16 size-44 rounded-full bg-violet-500/10 blur-3xl" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-violet-500" /> Smart insight
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">A useful signal from this month.</p>
          </CardHeader>
          <CardContent className="relative">
            <div className="rounded-2xl border border-violet-500/15 bg-background/45 p-4">
              <p className="text-sm leading-6">{insight}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-violet-500/10 bg-violet-500/5 p-3">
                <TrendingUp className="size-4 text-emerald-500" />
                <p className="mt-2 text-xs text-muted-foreground">Income</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(summary.income.AED, "AED")}</p>
              </div>
              <div className="rounded-2xl border border-violet-500/10 bg-violet-500/5 p-3">
                <TrendingDown className="size-4 text-rose-500" />
                <p className="mt-2 text-xs text-muted-foreground">Expenses</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(summary.expenses.AED, "AED")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="relative overflow-hidden border-blue-500/15 bg-gradient-to-br from-blue-500/8 via-card to-transparent shadow-[0_28px_90px_-55px_rgba(59,130,246,0.75)] xl:col-span-2">
          <div className="pointer-events-none absolute -left-14 -top-20 size-48 rounded-full bg-blue-500/8 blur-3xl" />
          <CardHeader className="relative flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Your latest money movements.</p>
            </div>
            <Link href="/transactions" className="text-xs font-medium text-blue-500 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="relative px-3 pb-3">
            {recentTransactions.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center text-center">
                <ReceiptText className="size-5 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Your latest activity will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTransactions.map((transaction, index) => {
                  const income = transaction.type === "income";
                  return (
                    <div
                      key={transaction.id}
                      className="group relative flex items-center justify-between gap-4 rounded-2xl px-3 py-3.5 transition hover:bg-background/55"
                    >
                      {index < recentTransactions.length - 1 ? (
                        <span className="absolute bottom-[-8px] left-[30px] top-[48px] w-px bg-border/70" />
                      ) : null}
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1",
                            income
                              ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/15"
                              : "bg-rose-500/10 text-rose-500 ring-rose-500/15"
                          )}
                        >
                          {income ? (
                            <ArrowDownLeft className="size-4" />
                          ) : (
                            <ArrowUpRight className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {getTransactionDisplayTitle(transaction)}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {transaction.categories?.name ?? "Uncategorized"} · {transaction.accounts?.name ?? "No account"} · {formatTransactionDate(transaction.transaction_date)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-sm font-semibold",
                          income ? "text-emerald-500" : "text-foreground"
                        )}
                      >
                        {income ? "+" : "-"}
                        {formatMoney(Number(transaction.amount), transaction.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-indigo-500/15 bg-gradient-to-br from-indigo-500/9 via-card to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="size-4 text-indigo-500" /> Monthly pulse
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">A compact view of your activity.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border bg-background/45 px-4 py-3">
              <span className="text-xs text-muted-foreground">Transactions</span>
              <span className="text-sm font-semibold">{summary.transactionCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border bg-background/45 px-4 py-3">
              <span className="text-xs text-muted-foreground">Receipts</span>
              <span className="text-sm font-semibold">{monthPurchases.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border bg-background/45 px-4 py-3">
              <span className="text-xs text-muted-foreground">Fuel fill-ups</span>
              <span className="text-sm font-semibold">{monthFuel.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border bg-background/45 px-4 py-3">
              <span className="text-xs text-muted-foreground">Active accounts</span>
              <span className="text-sm font-semibold">{accounts.filter((account) => account.is_active).length}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPeopleBalances people={people} />
        <DashboardSubscriptions subscriptions={subscriptions} />
      </section>
    </div>
  );
}
