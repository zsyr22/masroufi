import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Repeat2,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/features/accounts/utils/account-summary";
import type { SubscriptionListItem } from "@/features/subscriptions/types/subscription";
import {
  calculateMonthlyEquivalent,
  getBillingCycleLabel,
  getDaysUntilPayment,
  getSubscriptionStatusLabel,
  isSubscriptionOverdue,
} from "@/features/subscriptions/utils/subscription-utils";
import { cn } from "@/lib/utils";

type DashboardSubscriptionsProps = { subscriptions: SubscriptionListItem[] };
type CurrencyTotals = { AED: number; USD: number };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function paymentTimingLabel(value: string): string {
  const days = getDaysUntilPayment(value);
  if (days === null) return "No payment date";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

const statusClasses = {
  active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  completed: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  paused: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  cancelled: "border-border bg-muted text-muted-foreground",
} as const;

export function DashboardSubscriptions({ subscriptions }: DashboardSubscriptionsProps) {
  const active = subscriptions.filter((item) => item.status === "active");
  const recurring = active.filter((item) => item.billing_cycle !== "one_time");
  const overdue = active.filter((item) => isSubscriptionOverdue(item.next_payment_date, item.status));
  const upcoming = active
    .filter((item): item is SubscriptionListItem & { next_payment_date: string } => Boolean(item.next_payment_date))
    .sort((a, b) => a.next_payment_date.localeCompare(b.next_payment_date))
    .slice(0, 3);

  const monthly = recurring.reduce<CurrencyTotals>((totals, item) => {
    totals[item.currency] += calculateMonthlyEquivalent(Number(item.amount), item.billing_cycle);
    return totals;
  }, { AED: 0, USD: 0 });

  const paid = subscriptions.reduce<CurrencyTotals>((totals, item) => {
    for (const payment of item.subscription_payments ?? []) {
      totals[item.currency] += Number(payment.amount);
    }
    return totals;
  }, { AED: 0, USD: 0 });

  const portfolio = [...subscriptions]
    .sort((a, b) => (b.last_paid_at ?? b.updated_at).localeCompare(a.last_paid_at ?? a.updated_at))
    .slice(0, 3);

  const list = upcoming.length > 0 ? upcoming : portfolio;
  const showingUpcoming = upcoming.length > 0;

  return (
    <Card className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-fuchsia-500/5 shadow-[0_24px_80px_-42px_rgba(139,92,246,0.7)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-violet-500/10">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
              <Repeat2 className="size-4" />
            </span>
            Subscriptions
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">Your complete subscription portfolio and next commitments.</p>
        </div>
        <Link href="/subscriptions" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>View all <ArrowRight className="size-4" /></Link>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/7 p-4">
            <p className="text-xs text-muted-foreground">Total portfolio</p>
            <p className="mt-2 text-2xl font-semibold">{subscriptions.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
            <p className="text-xs text-muted-foreground">Active now</p>
            <p className="mt-2 text-2xl font-semibold">{active.length}</p>
          </div>
          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
            <p className="text-xs text-muted-foreground">Monthly recurring</p>
            <p className="mt-2 text-base font-semibold">{formatMoney(monthly.AED, "AED")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatMoney(monthly.USD, "USD")}</p>
          </div>
          <div className={cn("rounded-2xl border p-4", overdue.length ? "border-destructive/30 bg-destructive/7" : "border-blue-500/15 bg-blue-500/5")}>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {overdue.length ? <AlertTriangle className="size-3.5 text-destructive" /> : <WalletCards className="size-3.5 text-blue-400" />}
              {overdue.length ? "Overdue" : "Paid to date"}
            </p>
            <p className={cn("mt-2 text-base font-semibold", overdue.length && "text-destructive")}>
              {overdue.length ? overdue.length : formatMoney(paid.AED, "AED")}
            </p>
            {!overdue.length && <p className="mt-1 text-xs text-muted-foreground">{formatMoney(paid.USD, "USD")}</p>}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">{showingUpcoming ? "Upcoming payments" : "Subscription portfolio"}</h3>
            <Link href="/subscriptions/new" className="text-xs font-medium text-violet-400 hover:text-violet-300">Add subscription</Link>
          </div>

          {list.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-violet-500/20 bg-violet-500/3 px-5 text-center">
              <CalendarClock className="size-5 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No subscriptions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add a service to track its contract and payment history.</p>
            </div>
          ) : (
            <div className="divide-y divide-violet-500/10 overflow-hidden rounded-2xl border border-violet-500/15 bg-background/30">
              {list.map((item) => {
                const isUpcoming = showingUpcoming && Boolean(item.next_payment_date);
                const isOverdue = isUpcoming ? isSubscriptionOverdue(item.next_payment_date, item.status) : false;
                return (
                  <Link key={item.id} href={`/subscriptions/${item.id}/edit`} className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-violet-500/5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", isOverdue ? "bg-destructive/10 text-destructive" : item.status === "completed" ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400")}>
                        {item.status === "completed" ? <CheckCircle2 className="size-4" /> : <CalendarClock className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", statusClasses[item.status])}>{getSubscriptionStatusLabel(item.status)}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{getBillingCycleLabel(item.billing_cycle)} · {item.accounts?.name ?? "No account"}</p>
                      </div>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-sm font-semibold">{formatMoney(Number(item.amount), item.currency)}</p>
                      <p className={cn("mt-0.5 text-xs", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                        {isUpcoming && item.next_payment_date
                          ? `${formatDate(item.next_payment_date)} · ${paymentTimingLabel(item.next_payment_date)}`
                          : item.last_paid_at
                            ? `Last paid ${formatDate(item.last_paid_at)}`
                            : getSubscriptionStatusLabel(item.status)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
