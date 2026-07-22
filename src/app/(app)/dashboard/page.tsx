import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  Plus,
  Repeat2,
  Users,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const recentTransactions = [
  {
    id: 1,
    name: "Kaspersky",
    category: "Subscriptions",
    amount: "-123 AED",
    date: "21 Jul 2026",
  },
  {
    id: 2,
    name: "ENOC",
    category: "Fuel",
    amount: "-180 AED",
    date: "20 Jul 2026",
  },
  {
    id: 3,
    name: "Salary",
    category: "Income",
    amount: "+7,000 AED",
    date: "01 Jul 2026",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Track your money, expenses, savings, and personal balances."
        action={
          <Button>
            <Plus className="size-4" />
            Add transaction
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available money"
          value="4,800 AED"
          description="Across active accounts"
          icon={Wallet}
        />

        <StatCard
          title="Savings"
          value="10,000 AED"
          description="Plus 3,000 USD"
          icon={PiggyBank}
          tone="success"
        />

        <StatCard
          title="This month income"
          value="7,000 AED"
          description="Salary and other income"
          icon={ArrowDownLeft}
          tone="success"
        />

        <StatCard
          title="This month expenses"
          value="2,150 AED"
          description="31% of monthly income"
          icon={ArrowUpRight}
          tone="danger"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Recent transactions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-1">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {transaction.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {transaction.category} · {transaction.date}
                  </p>
                </div>

                <p className="text-sm font-medium">
                  {transaction.amount}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-primary" />
                People balances
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  People owe me
                </span>

                <span className="text-sm font-semibold text-emerald-500">
                  260 AED
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  I owe people
                </span>

                <span className="text-sm font-semibold text-destructive">
                  180 AED
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Repeat2 className="size-4 text-primary" />
                Next subscription
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm font-medium">
                Kaspersky
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                123 AED · Renews 21 Jul 2027
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="size-4 text-primary" />
                Main account
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-lg font-semibold">
                Emirates NBD
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                4,500 AED available
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}