import Link from "next/link";
import { ArrowUpRight, Banknote, Landmark, PiggyBank, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AccountDangerActions } from "@/features/accounts/components/account-danger-actions";
import { EditAccountDialog } from "@/features/accounts/components/edit-account-dialog";
import type { AccountWithBalance } from "@/features/accounts/types/account";
import { cn } from "@/lib/utils";

type AccountCardProps = { account: AccountWithBalance };

const accountTypeDetails = {
  bank: { label: "Bank account", icon: Landmark, tone: "from-sky-500/12 border-sky-500/20 text-sky-400 bg-sky-500/15" },
  cash: { label: "Cash", icon: Banknote, tone: "from-emerald-500/12 border-emerald-500/20 text-emerald-400 bg-emerald-500/15" },
  savings: { label: "Savings", icon: PiggyBank, tone: "from-violet-500/12 border-violet-500/20 text-violet-400 bg-violet-500/15" },
};

function formatBalance(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;
}

export function AccountCard({ account }: AccountCardProps) {
  const details = accountTypeDetails[account.type];
  const Icon = details.icon;
  const [gradient, border, text, bg] = details.tone.split(" ");

  return (
    <Card className={cn("group relative overflow-hidden bg-gradient-to-br via-card to-card transition duration-300 hover:-translate-y-1 hover:shadow-xl", gradient, border)}>
      <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-current opacity-[0.035] blur-3xl" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", text, bg)}><Icon className="size-5" /></div>
            <div className="min-w-0">
              <Link href={`/accounts/${account.id}`} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
                <span className="truncate">{account.name}</span><ArrowUpRight className="size-3.5 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">{details.label}</p>
            </div>
          </div>
          <Badge variant="secondary">{account.currency}</Badge>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Current balance</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{formatBalance(Number(account.current_balance), account.currency)}</p>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-2 text-xs text-muted-foreground">
          <WalletCards className="size-3.5" />
          {account.is_included_in_available_balance ? "Included in available money" : "Excluded from available money"}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/accounts/${account.id}`} className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background/70 px-3 text-sm font-medium transition hover:bg-accent">View details</Link>
            <EditAccountDialog account={account} />
          </div>
          <AccountDangerActions accountId={account.id} accountName={account.name} />
        </div>
      </CardContent>
    </Card>
  );
}
