import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChartNoAxesCombined, PackageSearch, ReceiptText, Scale, ShoppingBag, Truck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/features/accounts/utils/account-summary";
import { getBillPaymentHistory } from "@/features/bills/services/bill-service";
import { MonthlyComparisonCard } from "@/features/reports/components/monthly-comparison-card";
import { ReportBreakdownCard } from "@/features/reports/components/report-breakdown-card";
import { getPurchaseReportRows } from "@/features/reports/services/report-service";
import { calculateAccountBreakdown, calculateCategoryBreakdown, calculateMonthlyComparison, calculateReportsSummary, formatReportDate, getCurrentMonthLabel, getLargestExpenses, type ReportBreakdownItem } from "@/features/reports/utils/report-utils";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import { getTransactionDisplayTitle } from "@/features/transactions/utils/transaction-display";

function emptyAmounts() { return { AED: 0, USD: 0 }; }

function purchaseBreakdown(rows: Awaited<ReturnType<typeof getPurchaseReportRows>>, mode: "store" | "product"): ReportBreakdownItem[] {
  const month = new Date().toISOString().slice(0, 7);
  const map = new Map<string, ReportBreakdownItem>();
  for (const purchase of rows.filter((row) => row.purchase_date.startsWith(month))) {
    if (mode === "store") {
      const name = purchase.stores?.name ?? "Unknown store";
      const item = map.get(name) ?? { id: name, name, amount: emptyAmounts(), transactionCount: 0 };
      item.amount[purchase.currency] += Number(purchase.total);
      item.transactionCount += 1;
      map.set(name, item);
    } else {
      for (const product of purchase.purchase_items) {
        const key = product.name.trim().toLocaleLowerCase();
        const item = map.get(key) ?? { id: key, name: product.name, amount: emptyAmounts(), transactionCount: 0 };
        item.amount[purchase.currency] += Number(product.line_total);
        item.transactionCount += 1;
        map.set(key, item);
      }
    }
  }
  return [...map.values()].sort((a, b) => b.amount.AED - a.amount.AED || b.amount.USD - a.amount.USD).slice(0, 8);
}

export default async function ReportsPage() {
  const [transactionResult, purchases, billPayments] = await Promise.all([
    getCurrentUserTransactions({ pageSize: 100 }),
    getPurchaseReportRows(),
    getBillPaymentHistory(100),
  ]);
  const transactions = transactionResult.transactions;
  const summary = calculateReportsSummary(transactions);
  const categoryBreakdown = calculateCategoryBreakdown(transactions);
  const accountBreakdown = calculateAccountBreakdown(transactions);
  const monthlyComparison = calculateMonthlyComparison(transactions);
  const largestExpenses = getLargestExpenses(transactions);
  const storeBreakdown = purchaseBreakdown(purchases, "store");
  const productBreakdown = purchaseBreakdown(purchases, "product");
  const month = new Date().toISOString().slice(0, 7);
  const monthPurchases = purchases.filter((row) => row.purchase_date.startsWith(month));
  const deliveryFees = monthPurchases.reduce((total, row) => total + (row.currency === "AED" ? Number(row.delivery_fee) : 0), 0);
  const purchaseSpend = monthPurchases.reduce((total, row) => total + (row.currency === "AED" ? Number(row.total) : 0), 0);
  const currentBillPayments = billPayments.filter((payment) => payment.paid_at.startsWith(month));
  const billsPaid = currentBillPayments.reduce((total, payment) => total + (payment.bill?.currency === "AED" ? Number(payment.amount) : 0), 0);
  const expenseShare = summary.income.AED > 0 ? (summary.expenses.AED / summary.income.AED) * 100 : 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description={`A complete financial analysis for ${getCurrentMonthLabel()} — not just totals, but where the money actually went.`} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Monthly income" value={formatMoney(summary.income.AED, "AED")} description={`${formatMoney(summary.income.USD, "USD")} income`} icon={ArrowDownLeft} tone="success" />
        <StatCard title="Monthly expenses" value={formatMoney(summary.expenses.AED, "AED")} description={`${expenseShare.toFixed(0)}% of AED income`} icon={ArrowUpRight} tone="danger" />
        <StatCard title="Monthly net" value={formatMoney(summary.net.AED, "AED")} description={`${formatMoney(summary.net.USD, "USD")} net`} icon={Scale} tone={summary.net.AED >= 0 ? "success" : "danger"} />
        <StatCard title="Daily expense average" value={formatMoney(summary.averageDailyExpenses.AED, "AED")} description={`${summary.transactionCount} transactions this month`} icon={CalendarDays} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-amber-500/15 bg-gradient-to-br from-amber-500/7 via-card to-transparent"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ShoppingBag className="size-4 text-amber-500" /> Itemized purchases</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatMoney(purchaseSpend, "AED")}</p><p className="mt-1 text-xs text-muted-foreground">{monthPurchases.length} receipts this month</p></CardContent></Card>
        <Card className="border-sky-500/15 bg-gradient-to-br from-sky-500/7 via-card to-transparent"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ReceiptText className="size-4 text-sky-500" /> Bills paid</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatMoney(billsPaid, "AED")}</p><p className="mt-1 text-xs text-muted-foreground">{currentBillPayments.length} fixed bill payments</p></CardContent></Card>
        <Card className="border-orange-500/15 bg-gradient-to-br from-orange-500/7 via-card to-transparent"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Truck className="size-4 text-orange-500" /> Delivery fees</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatMoney(deliveryFees, "AED")}</p><p className="mt-1 text-xs text-muted-foreground">Extra cost on online purchases</p></CardContent></Card>
        <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/7 via-card to-transparent"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><PackageSearch className="size-4 text-violet-500" /> Products tracked</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{productBreakdown.length}</p><p className="mt-1 text-xs text-muted-foreground">Top products shown below</p></CardContent></Card>
      </section>

      <MonthlyComparisonCard months={monthlyComparison} />

      <section className="grid gap-4 lg:grid-cols-2">
        <ReportBreakdownCard title="Expenses by category" description="Your biggest spending areas this month." items={categoryBreakdown} />
        <ReportBreakdownCard title="Expenses by account" description="Which accounts funded your spending." items={accountBreakdown} />
        <ReportBreakdownCard title="Purchases by store" description="Where your itemized purchase money went." items={storeBreakdown} />
        <ReportBreakdownCard title="Top purchased products" description="Products consuming the most money this month." items={productBreakdown} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-rose-500/15 bg-gradient-to-br from-rose-500/5 via-card to-transparent lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4 text-rose-500" /> Largest expenses</CardTitle><p className="text-sm text-muted-foreground">The transactions with the biggest impact this month.</p></CardHeader>
          <CardContent>{largestExpenses.length === 0 ? <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">No expenses recorded this month.</div> : <div className="divide-y divide-border">{largestExpenses.map((transaction, index) => <div key={transaction.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-sm font-semibold text-rose-500">{index + 1}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{getTransactionDisplayTitle(transaction)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{transaction.categories?.name ?? "Uncategorized"} · {formatReportDate(transaction.transaction_date)}</p></div></div><p className="shrink-0 text-sm font-semibold">{formatMoney(Number(transaction.amount), transaction.currency)}</p></div>)}</div>}</CardContent>
        </Card>

        <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/7 via-card to-transparent">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ChartNoAxesCombined className="size-4 text-emerald-500" /> Month health</CardTitle><p className="text-sm text-muted-foreground">A fast read of your financial position.</p></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-background/55 p-4"><p className="text-xs text-muted-foreground">Expense-to-income ratio</p><p className="mt-2 text-2xl font-semibold">{expenseShare.toFixed(0)}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, expenseShare)}%` }} /></div></div>
            <div className="rounded-xl border bg-background/55 p-4"><p className="text-xs text-muted-foreground">Transactions recorded</p><p className="mt-2 text-2xl font-semibold">{summary.transactionCount}</p></div>
            <div className="rounded-xl border bg-background/55 p-4"><p className="text-xs text-muted-foreground">Current result</p><p className={`mt-2 text-lg font-semibold ${summary.net.AED >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{summary.net.AED >= 0 ? "You are inside your income" : "Expenses are above income"}</p></div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
