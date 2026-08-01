import { CircleDollarSign, PiggyBank, WalletCards } from "lucide-react";

import type { AccountSummary } from "@/features/accounts/utils/account-summary";
import { formatMoney } from "@/features/accounts/utils/account-summary";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AccountsSummaryProps = { summary: AccountSummary };

type SummaryCardProps = {
  title: string;
  description: string;
  aedAmount: number;
  usdAmount: number;
  icon: typeof WalletCards;
  tone: "violet" | "emerald" | "blue";
};

const tones = {
  violet: "border-violet-500/20 from-violet-500/12 shadow-[0_20px_60px_rgba(139,92,246,0.09)] group-hover:border-violet-400/40",
  emerald: "border-emerald-500/20 from-emerald-500/12 shadow-[0_20px_60px_rgba(16,185,129,0.09)] group-hover:border-emerald-400/40",
  blue: "border-sky-500/20 from-sky-500/12 shadow-[0_20px_60px_rgba(14,165,233,0.09)] group-hover:border-sky-400/40",
};

const iconTones = {
  violet: "bg-violet-500/15 text-violet-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-sky-500/15 text-sky-400",
};

function SummaryCard({ title, description, aedAmount, usdAmount, icon: Icon, tone }: SummaryCardProps) {
  return (
    <Card className={cn("group relative overflow-hidden bg-gradient-to-br via-card to-card transition duration-300 hover:-translate-y-1", tones[tone])}>
      <div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-current opacity-[0.04] blur-2xl" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
            <p className="mt-2 text-xs text-muted-foreground/75">{description}</p>
          </div>
          <div className={cn("flex size-11 items-center justify-center rounded-2xl", iconTones[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
        <p className="mt-7 text-3xl font-semibold tracking-tight">{formatMoney(aedAmount, "AED")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatMoney(usdAmount, "USD")}</p>
      </CardContent>
    </Card>
  );
}

export function AccountsSummary({ summary }: AccountsSummaryProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <SummaryCard title="Available money" description="Ready for everyday spending" aedAmount={summary.available.AED} usdAmount={summary.available.USD} icon={WalletCards} tone="violet" />
      <SummaryCard title="Savings" description="Money protected from daily spending" aedAmount={summary.savings.AED} usdAmount={summary.savings.USD} icon={PiggyBank} tone="emerald" />
      <SummaryCard title="Total balances" description="Across all active accounts" aedAmount={summary.total.AED} usdAmount={summary.total.USD} icon={CircleDollarSign} tone="blue" />
    </section>
  );
}
