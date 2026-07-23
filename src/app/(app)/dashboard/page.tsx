import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  ReceiptText,
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
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import {
  calculateAccountSummary,
  formatMoney,
} from "@/features/accounts/utils/account-summary";

export default async function DashboardPage() {
  const accounts = await getCurrentUserAccounts();
  const summary = calculateAccountSummary(accounts);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="A clear overview of your money and recent financial activity."
        action={
          <Button disabled>
            <Plus className="size-4" />
            Add transaction
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available money"
          value={formatMoney(summary.available.AED, "AED")}
          description={`${formatMoney(
            summary.available.USD,
            "USD"
          )} also available`}
          icon={Wallet}
        />

        <StatCard
          title="Savings"
          value={formatMoney(summary.savings.AED, "AED")}
          description={`${formatMoney(
            summary.savings.USD,
            "USD"
          )} saved`}
          icon={PiggyBank}
          tone="success"
        />

        <StatCard
          title="This month income"
          value="0.00 AED"
          description="Transactions are not added yet"
          icon={ArrowDownLeft}
          tone="success"
        />

        <StatCard
          title="This month expenses"
          value="0.00 AED"
          description="Transactions are not added yet"
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

          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ReceiptText className="size-5" />
            </div>

            <h2 className="mt-4 text-sm font-semibold">
              No transactions yet
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Once you add income or expenses, your latest transactions
              will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              People balances
            </CardTitle>
          </CardHeader>

          <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
            <p className="text-sm font-medium">
              No balances with people
            </p>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Money owed to you or owed by you will appear here.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}