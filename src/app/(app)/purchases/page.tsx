import Link from "next/link";
import {
  ChevronRight,
  CircleDollarSign,
  Plus,
  ReceiptText,
  ShoppingBasket,
  Store,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserPurchases } from "@/features/purchases/services/purchase-service";
import { cn } from "@/lib/utils";

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(value)
  );

const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

export default async function PurchasesPage() {
  const purchases = await getCurrentUserPurchases();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthPurchases = purchases.filter((purchase) =>
    purchase.purchase_date.startsWith(currentMonth)
  );
  const monthSpend = monthPurchases.reduce(
    (sum, purchase) =>
      sum + (purchase.currency === "AED" ? Number(purchase.total) : 0),
    0
  );
  const storeCounts = monthPurchases.reduce<Record<string, number>>(
    (result, purchase) => {
      const name = purchase.stores?.name ?? "Unknown store";
      result[name] = (result[name] ?? 0) + 1;
      return result;
    },
    {}
  );
  const topStore = Object.entries(storeCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Purchases"
        description="Keep every receipt, product and store in one polished shopping history."
        action={
          <Link href="/purchases/new" className={buttonVariants()}>
            <Plus className="size-4" /> New purchase
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Receipts this month"
          value={String(monthPurchases.length)}
          description={`${purchases.length} total recorded receipts`}
          icon={ReceiptText}
          tone="warning"
        />
        <StatCard
          title="Purchase spend"
          value={money(monthSpend, "AED")}
          description="Itemized purchases this month"
          icon={CircleDollarSign}
          tone="warning"
        />
        <StatCard
          title="Top store"
          value={topStore?.[0] ?? "—"}
          description={topStore ? `${topStore[1]} visits this month` : "No purchases yet"}
          icon={Store}
        />
      </section>

      {purchases.length === 0 ? (
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-orange-500/5">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <ShoppingBasket className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Your receipts have a home now</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Add Carrefour, Lulu, Amazon, or any receipt with all its items and one accurate account transaction.
            </p>
            <Link href="/purchases/new" className={cn(buttonVariants(), "mt-5")}>
              <Plus className="size-4" /> Add first receipt
            </Link>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Purchase history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {purchases.length} receipts with their original totals and products.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {purchases.map((purchase) => (
              <Link key={purchase.id} href={`/purchases/${purchase.id}`}>
                <Card className="h-full overflow-hidden border-amber-500/12 bg-gradient-to-br from-amber-500/7 via-card to-transparent transition duration-200 hover:border-amber-500/30 hover:bg-amber-500/5">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-500 ring-1 ring-amber-500/15">
                      <ReceiptText className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold">
                            {purchase.stores?.name ?? "Store"}
                          </h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {date(purchase.purchase_date)} · {purchase.purchase_items?.[0]?.count ?? 0} items · {purchase.accounts?.name}
                          </p>
                        </div>
                        <strong className="shrink-0 text-base">
                          {money(purchase.total, purchase.currency)}
                        </strong>
                      </div>
                      {purchase.notes ? (
                        <p className="mt-2 truncate text-xs text-muted-foreground">
                          {purchase.notes}
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
