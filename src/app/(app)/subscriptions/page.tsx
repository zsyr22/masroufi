import Link from "next/link";
import {
  Plus,
  Repeat2,
} from "lucide-react";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Recurring payments
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Subscriptions
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Track recurring services and
            record their payments.
          </p>
        </div>

        <Link
          href="/subscriptions/new"
          className={buttonVariants()}
        >
          <Plus className="size-4" />
          Add subscription
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/6 via-card to-transparent">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Active subscriptions
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {activeSubscriptions.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/6 via-card to-transparent">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Monthly equivalent
            </p>

            <div className="mt-2 space-y-1">
              {Object.entries(
                totals
              ).length > 0 ? (
                Object.entries(
                  totals
                ).map(
                  ([
                    currency,
                    total,
                  ]) => (
                    <p
                      key={
                        currency
                      }
                      className="text-lg font-semibold"
                    >
                      {formatMoney(
                        total.monthly,
                        currency
                      )}
                    </p>
                  )
                )
              ) : (
                <p className="text-2xl font-semibold">
                  —
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/6 via-card to-transparent">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Yearly equivalent
            </p>

            <div className="mt-2 space-y-1">
              {Object.entries(
                totals
              ).length > 0 ? (
                Object.entries(
                  totals
                ).map(
                  ([
                    currency,
                    total,
                  ]) => (
                    <p
                      key={
                        currency
                      }
                      className="text-lg font-semibold"
                    >
                      {formatMoney(
                        total.yearly,
                        currency
                      )}
                    </p>
                  )
                )
              ) : (
                <p className="text-2xl font-semibold">
                  —
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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