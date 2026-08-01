import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Landmark,
  PiggyBank,
  Scale,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditAccountDialog } from "@/features/accounts/components/edit-account-dialog";
import { getCurrentUserAccountDetails } from "@/features/accounts/services/account-service";
import type { AccountActivityItem } from "@/features/accounts/types/account-activity";

const typeDetails = {
  bank: { label: "Bank account", icon: Landmark },
  cash: { label: "Cash", icon: Banknote },
  savings: { label: "Savings", icon: PiggyBank },
};

function formatMoney(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function activityIcon(activity: AccountActivityItem) {
  if (activity.amount >= 0) {
    return <ArrowDownLeft className="size-4" />;
  }
  return <ArrowUpRight className="size-4" />;
}

export default async function AccountDetailsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const details = await getCurrentUserAccountDetails(accountId);

  if (!details) notFound();

  const { account } = details;
  const accountType = typeDetails[account.type];
  const AccountIcon = accountType.icon;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[28px] border border-sky-500/20 bg-gradient-to-br from-sky-500/12 via-card to-violet-500/8 p-6 shadow-[0_24px_90px_rgba(14,165,233,0.08)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-4">
          <Link
            href="/accounts"
            className="-ml-3 inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to accounts
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <AccountIcon className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">{account.name}</h1>
                <Badge variant="secondary">{account.currency}</Badge>
                {!account.is_active && <Badge variant="outline">Archived</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{accountType.label} · Complete balance history</p>
            </div>
          </div>
        </div>

        <EditAccountDialog account={account} />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-sky-500/15 bg-gradient-to-br from-sky-500/8 via-card to-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Opening balance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{formatMoney(Number(account.opening_balance), account.currency)}</p></CardContent>
        </Card>
        <Card className="border-emerald-500/15 bg-gradient-to-br from-emerald-500/8 via-card to-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Money in</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-emerald-500">+{formatMoney(details.moneyIn, account.currency)}</p></CardContent>
        </Card>
        <Card className="border-rose-500/15 bg-gradient-to-br from-rose-500/8 via-card to-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Money out</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold text-red-500">-{formatMoney(details.moneyOut, account.currency)}</p></CardContent>
        </Card>
        <Card className="border-violet-500/25 bg-gradient-to-br from-violet-500/12 via-card to-card shadow-[0_18px_60px_rgba(139,92,246,0.07)]">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Current balance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{formatMoney(Number(account.current_balance), account.currency)}</p></CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden border-violet-500/15 bg-gradient-to-br from-violet-500/7 via-card to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Scale className="size-5" /></div>
            <div>
              <CardTitle>How this balance was calculated</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Every dirham in the current balance is explained below.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/25 p-4 text-sm sm:text-base">
            <strong>{formatMoney(Number(account.opening_balance), account.currency)}</strong>
            <span className="text-muted-foreground">opening</span>
            <span>+</span>
            <strong className="text-emerald-500">{formatMoney(details.moneyIn, account.currency)}</strong>
            <span className="text-muted-foreground">in</span>
            <span>−</span>
            <strong className="text-red-500">{formatMoney(details.moneyOut, account.currency)}</strong>
            <span className="text-muted-foreground">out</span>
            <span>=</span>
            <strong>{formatMoney(Number(account.current_balance), account.currency)}</strong>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Income transactions</p><p className="mt-1 font-medium">+{formatMoney(details.transactionIncome, account.currency)}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Incoming transfers</p><p className="mt-1 font-medium">+{formatMoney(details.transfersIn, account.currency)}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Expense transactions</p><p className="mt-1 font-medium">-{formatMoney(details.transactionExpenses, account.currency)}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Outgoing transfers</p><p className="mt-1 font-medium">-{formatMoney(details.transfersOut, account.currency)}</p></div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Account activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">Transactions, transfers, and the account starting balance in one ledger.</p>
        </div>

        <Card className="overflow-hidden border-sky-500/15 bg-gradient-to-br from-sky-500/6 via-card to-transparent">
          <CardContent className="p-0">
            {details.activities.map((activity, index) => (
              <div key={activity.id} className={`flex items-center justify-between gap-4 p-4 sm:p-5 ${index > 0 ? "border-t" : ""}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${activity.amount >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                    {activityIcon(activity)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{activity.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatDate(activity.occurredAt)}{activity.subtitle ? ` · ${activity.subtitle}` : ""}
                    </p>
                  </div>
                </div>
                <p className={`shrink-0 font-semibold tabular-nums ${activity.amount > 0 ? "text-emerald-500" : activity.amount < 0 ? "text-red-500" : ""}`}>
                  {activity.amount > 0 ? "+" : ""}{formatMoney(activity.amount, activity.currency)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
