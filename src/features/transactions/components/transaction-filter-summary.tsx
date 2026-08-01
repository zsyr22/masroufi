import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";

import type { TransactionListItem } from "@/features/transactions/services/transaction-service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TransactionFilterSummaryProps = { transactions: TransactionListItem[] };

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function TransactionFilterSummary({ transactions }: TransactionFilterSummaryProps) {
  const totalIncome = transactions.filter((transaction) => transaction.type === "income").reduce((total, transaction) => total + Number(transaction.amount), 0);
  const totalExpenses = transactions.filter((transaction) => transaction.type === "expense").reduce((total, transaction) => total + Number(transaction.amount), 0);
  const netAmount = totalIncome - totalExpenses;
  const currency = transactions[0]?.currency ?? "AED";
  const items = [
    { label: "Income", value: totalIncome, icon: ArrowDownLeft, shell: "border-emerald-500/20 from-emerald-500/12 shadow-[0_18px_50px_rgba(16,185,129,0.08)]", iconClass: "bg-emerald-500/15 text-emerald-400" },
    { label: "Expenses", value: totalExpenses, icon: ArrowUpRight, shell: "border-rose-500/20 from-rose-500/12 shadow-[0_18px_50px_rgba(244,63,94,0.08)]", iconClass: "bg-rose-500/15 text-rose-400" },
    { label: "Net cash flow", value: netAmount, icon: Scale, shell: netAmount >= 0 ? "border-violet-500/20 from-violet-500/12 shadow-[0_18px_50px_rgba(139,92,246,0.08)]" : "border-amber-500/20 from-amber-500/12 shadow-[0_18px_50px_rgba(245,158,11,0.08)]", iconClass: netAmount >= 0 ? "bg-violet-500/15 text-violet-400" : "bg-amber-500/15 text-amber-400" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className={cn("group bg-gradient-to-br via-card to-card transition duration-300 hover:-translate-y-1", item.shell)}>
            <CardContent className="flex items-center gap-4 p-5 sm:p-6">
              <div className={cn("flex size-11 items-center justify-center rounded-2xl", item.iconClass)}><Icon className="size-5" /></div>
              <div><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{formatAmount(item.value)} {currency}</p></div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
