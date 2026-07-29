import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, PiggyBank, ReceiptText, ShoppingBasket, Target, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { calculateAccountSummary, formatMoney } from "@/features/accounts/utils/account-summary";
import { getBills } from "@/features/bills/services/bill-service";
import { DashboardBills } from "@/features/dashboard/components/dashboard-bills";
import { DashboardSubscriptions } from "@/features/dashboard/components/dashboard-subscriptions";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { DashboardPeopleBalances } from "@/features/people/components/dashboard-people-balances";
import { getCurrentUserPeopleBalances } from "@/features/people/services/people-service";
import { getCurrentUserPurchases } from "@/features/purchases/services/purchase-service";
import { calculateCategoryBreakdown, calculateReportsSummary, getCurrentMonthTransactions } from "@/features/reports/utils/report-utils";
import { getCurrentUserSubscriptions } from "@/features/subscriptions/services/subscription-service";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import { formatTransactionDate } from "@/features/transactions/utils/transaction-summary";
import { getTransactionDisplayTitle } from "@/features/transactions/utils/transaction-display";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const [accounts, transactionResult, people, subscriptions, bills, purchases] = await Promise.all([
    getCurrentUserAccounts(),
    getCurrentUserTransactions({ pageSize: 100 }),
    getCurrentUserPeopleBalances(),
    getCurrentUserSubscriptions(),
    getBills(),
    getCurrentUserPurchases(),
  ]);

  const transactions = transactionResult.transactions;
  const accountSummary = calculateAccountSummary(accounts);
  const summary = calculateReportsSummary(transactions);
  const categoryBreakdown = calculateCategoryBreakdown(transactions);
  const topCategory = categoryBreakdown[0];
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthPurchases = purchases.filter((purchase) => purchase.purchase_date.startsWith(currentMonth));
  const purchaseTotal = monthPurchases.reduce((total, purchase) => total + (purchase.currency === "AED" ? Number(purchase.total) : 0), 0);
  const savingsRate = summary.income.AED > 0 ? Math.max(0, (summary.net.AED / summary.income.AED) * 100) : 0;
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Your financial control room — balances, obligations, purchases, and what needs attention." />

      <QuickActions />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Available money" value={formatMoney(accountSummary.available.AED, "AED")} description={`${formatMoney(accountSummary.available.USD, "USD")} also available`} icon={Wallet} />
        <StatCard title="This month net" value={formatMoney(summary.net.AED, "AED")} description={`${summary.income.AED > 0 ? savingsRate.toFixed(0) : "0"}% of income kept`} icon={Target} tone={summary.net.AED >= 0 ? "success" : "danger"} />
        <StatCard title="This month income" value={formatMoney(summary.income.AED, "AED")} description={`${formatMoney(summary.income.USD, "USD")} income`} icon={ArrowDownLeft} tone="success" />
        <StatCard title="This month expenses" value={formatMoney(summary.expenses.AED, "AED")} description={`${summary.transactionCount} recorded transactions`} icon={ArrowUpRight} tone="danger" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-amber-500/15 bg-gradient-to-br from-amber-500/7 via-card to-transparent lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div><CardTitle className="flex items-center gap-2 text-base"><ShoppingBasket className="size-4 text-amber-500" /> Purchase activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">Receipts and itemized shopping this month.</p></div>
            <Link href="/purchases" className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline">View purchases <ArrowRight className="size-3" /></Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4"><p className="text-xs text-muted-foreground">Receipts</p><p className="mt-2 text-2xl font-semibold">{monthPurchases.length}</p></div>
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4"><p className="text-xs text-muted-foreground">Purchase spend</p><p className="mt-2 text-xl font-semibold">{formatMoney(purchaseTotal, "AED")}</p></div>
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4"><p className="text-xs text-muted-foreground">Top category</p><p className="mt-2 truncate text-xl font-semibold">{topCategory?.name ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">{topCategory ? formatMoney(topCategory.amount.AED, "AED") : "No spending yet"}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/7 via-card to-transparent">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PiggyBank className="size-4 text-emerald-500" /> Savings position</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{formatMoney(accountSummary.savings.AED, "AED")}</p><p className="mt-2 text-sm text-muted-foreground">Dedicated savings accounts</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, savingsRate)}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">Monthly retention rate: {savingsRate.toFixed(0)}%</p></CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 via-card to-transparent xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Recent activity</CardTitle><Link href="/transactions" className="text-xs font-medium text-emerald-500 hover:underline">View all</Link></CardHeader>
          <CardContent className="p-2">
            {recentTransactions.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center text-center"><ReceiptText className="size-5 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">Your latest activity will appear here.</p></div> : <div className="divide-y divide-border">{recentTransactions.map((transaction) => { const income = transaction.type === "income"; return <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3.5 hover:bg-muted/35"><div className="flex min-w-0 items-center gap-3"><div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", income ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>{income ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{getTransactionDisplayTitle(transaction)}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{transaction.categories?.name ?? "Uncategorized"} · {transaction.accounts?.name ?? "No account"} · {formatTransactionDate(transaction.transaction_date)}</p></div></div><p className={cn("shrink-0 text-sm font-semibold", income ? "text-emerald-500" : "text-foreground")}>{income ? "+" : "-"}{formatMoney(Number(transaction.amount), transaction.currency)}</p></div>; })}</div>}
          </CardContent>
        </Card>
        <DashboardBills bills={bills} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2"><DashboardPeopleBalances people={people} /><DashboardSubscriptions subscriptions={subscriptions} /></section>
    </div>
  );
}
