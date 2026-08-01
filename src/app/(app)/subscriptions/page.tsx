import Link from "next/link";
import { CalendarClock, CircleDollarSign, Plus, Repeat2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

import {
  buttonVariants,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { SubscriptionCard } from "@/features/subscriptions/components/subscription-card";
import { getCurrentUserSubscriptions } from "@/features/subscriptions/services/subscription-service";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import {
  calculateMonthlyEquivalent,
  calculateYearlyEquivalent,
} from "@/features/subscriptions/utils/subscription-utils";

function formatMoney(
  amount: number,
  currency: string
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function SubscriptionsPage() {
  const [subscriptions, accounts] = await Promise.all([
    getCurrentUserSubscriptions(),
    getCurrentUserAccounts(),
  ]);

  const activeSubscriptions =
    subscriptions.filter(
      (subscription) =>
        subscription.status === "active"
    );

  const totals = activeSubscriptions.reduce(
    (result, subscription) => {
      const currency =
        subscription.currency;

      const current =
        result[currency] ?? {
          monthly: 0,
          yearly: 0,
        };

      current.monthly +=
        calculateMonthlyEquivalent(
          Number(subscription.amount),
          subscription.billing_cycle
        );

      current.yearly +=
        calculateYearlyEquivalent(
          Number(subscription.amount),
          subscription.billing_cycle
        );

      result[currency] = current;

      return result;
    },
    {} as Record<
      string,
      {
        monthly: number;
        yearly: number;
      }
    >
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title="Subscriptions"
        description="Track recurring services, contract value and every payment in one calm portfolio."
        action={
          <Link href="/subscriptions/new" className={buttonVariants()}>
            <Plus className="size-4" />
            Add subscription
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Active subscriptions"
          value={String(activeSubscriptions.length)}
          description={`${subscriptions.length} total subscriptions`}
          icon={Repeat2}
        />
        <StatCard
          title="Monthly equivalent"
          value={Object.entries(totals).length > 0 ? Object.entries(totals).map(([currency, total]) => formatMoney(total.monthly, currency)).join(" · ") : "—"}
          description="Recurring monthly commitment"
          icon={CalendarClock}
        />
        <StatCard
          title="Yearly equivalent"
          value={Object.entries(totals).length > 0 ? Object.entries(totals).map(([currency, total]) => formatMoney(total.yearly, currency)).join(" · ") : "—"}
          description="Estimated annual cost"
          icon={CircleDollarSign}
        />
      </section>

      {subscriptions.length > 0 ? (
        <div className="space-y-4">
          {subscriptions.map(
            (subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                accounts={accounts}
              />
            )
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Repeat2 className="size-6" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              No subscriptions yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Add recurring services such as
              Netflix, internet, antivirus or
              cloud storage.
            </p>

            <Link
              href="/subscriptions/new"
              className={`${buttonVariants()} mt-5`}
            >
              <Plus className="size-4" />
              Add first subscription
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}