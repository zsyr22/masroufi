import Link from "next/link";
import {
  CalendarRange,
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
import type { PurchaseListItem } from "@/features/purchases/types/purchase";
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

type Period = "this_month" | "last_month" | "this_year" | "all";

type SearchParams = Promise<{
  period?: string;
  store?: string;
}>;

type StoreSummary = {
  name: string;
  receipts: number;
  aedSpend: number;
  usdSpend: number;
};

const PERIODS: { value: Period; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "All time" },
];

function validPeriod(value?: string): Period {
  return PERIODS.some((period) => period.value === value)
    ? (value as Period)
    : "this_month";
}

function purchaseIsInPeriod(purchaseDate: string, period: Period) {
  if (period === "all") return true;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const [purchaseYear, purchaseMonth] = purchaseDate
    .split("-")
    .map((part) => Number(part));

  if (period === "this_month") {
    return purchaseYear === year && purchaseMonth === month + 1;
  }

  if (period === "last_month") {
    const lastMonth = new Date(year, month - 1, 1);
    return (
      purchaseYear === lastMonth.getFullYear() &&
      purchaseMonth === lastMonth.getMonth() + 1
    );
  }

  return purchaseYear === year;
}

function buildUrl(period: Period, storeName?: string) {
  const params = new URLSearchParams();

  if (period !== "this_month") {
    params.set("period", period);
  }

  if (storeName) {
    params.set("store", storeName);
  }

  const query = params.toString();
  return query ? `/purchases?${query}` : "/purchases";
}

function getStoreSummaries(purchases: PurchaseListItem[]): StoreSummary[] {
  const summaries = new Map<string, StoreSummary>();

  for (const purchase of purchases) {
    const name = purchase.stores?.name ?? "Unknown store";
    const current = summaries.get(name) ?? {
      name,
      receipts: 0,
      aedSpend: 0,
      usdSpend: 0,
    };

    current.receipts += 1;

    if (purchase.currency === "USD") {
      current.usdSpend += Number(purchase.total);
    } else if (purchase.currency === "AED") {
      current.aedSpend += Number(purchase.total);
    }

    summaries.set(name, current);
  }

  return Array.from(summaries.values()).sort((a, b) => {
    if (b.aedSpend !== a.aedSpend) return b.aedSpend - a.aedSpend;
    if (b.usdSpend !== a.usdSpend) return b.usdSpend - a.usdSpend;
    return b.receipts - a.receipts;
  });
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const purchases = await getCurrentUserPurchases();
  const params = await searchParams;
  const period = validPeriod(params.period);
  const selectedStore = params.store?.trim() || undefined;
  const periodLabel =
    PERIODS.find((option) => option.value === period)?.label ?? "This month";

  const periodPurchases = purchases.filter((purchase) =>
    purchaseIsInPeriod(purchase.purchase_date, period)
  );

  const storeSummaries = getStoreSummaries(periodPurchases);
  const availableStoreNames = new Set(
    storeSummaries.map((summary) => summary.name)
  );
  const activeStore =
    selectedStore && availableStoreNames.has(selectedStore)
      ? selectedStore
      : undefined;

  const visiblePurchases = activeStore
    ? periodPurchases.filter(
        (purchase) =>
          (purchase.stores?.name ?? "Unknown store") === activeStore
      )
    : periodPurchases;

  const periodSpendAed = periodPurchases.reduce(
    (sum, purchase) =>
      sum + (purchase.currency === "AED" ? Number(purchase.total) : 0),
    0
  );
  const periodSpendUsd = periodPurchases.reduce(
    (sum, purchase) =>
      sum + (purchase.currency === "USD" ? Number(purchase.total) : 0),
    0
  );

  const topStore = storeSummaries[0];

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
          title={`Receipts · ${periodLabel}`}
          value={String(periodPurchases.length)}
          description={`${purchases.length} total recorded receipts`}
          icon={ReceiptText}
          tone="warning"
        />
        <StatCard
          title={`Purchase spend · ${periodLabel}`}
          value={money(periodSpendAed, "AED")}
          description={
            periodSpendUsd > 0
              ? `${money(periodSpendUsd, "USD")} also recorded`
              : `${periodPurchases.length} receipts in this period`
          }
          icon={CircleDollarSign}
          tone="warning"
        />
        <StatCard
          title="Top store by spend"
          value={topStore?.name ?? "—"}
          description={
            topStore
              ? `${money(topStore.aedSpend, "AED")} · ${topStore.receipts} receipt${topStore.receipts === 1 ? "" : "s"}`
              : "No purchases in this period"
          }
          icon={Store}
        />
      </section>

      {purchases.length === 0 ? (
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-orange-500/5">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <ShoppingBasket className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">
              Your receipts have a home now
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Add Carrefour, Lulu, Amazon, or any receipt with all its items and
              one accurate account transaction.
            </p>
            <Link
              href="/purchases/new"
              className={cn(buttonVariants(), "mt-5")}
            >
              <Plus className="size-4" /> Add first receipt
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="space-y-4 rounded-2xl border border-amber-500/12 bg-gradient-to-br from-amber-500/6 via-card to-transparent p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/12 text-amber-500">
                    <Store className="size-4" />
                  </span>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Store spending
                  </h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  See exactly how much you spent at each store and open its
                  receipts with one click.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <CalendarRange className="mr-1 mt-2 size-4 text-muted-foreground" />
                {PERIODS.map((option) => (
                  <Link
                    key={option.value}
                    href={buildUrl(option.value, activeStore)}
                    className={cn(
                      buttonVariants({
                        variant:
                          period === option.value ? "default" : "outline",
                        size: "sm",
                      }),
                      "rounded-full"
                    )}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link href={buildUrl(period)} className="group">
                <Card
                  className={cn(
                    "h-full border-border/60 bg-background/45 transition duration-200 hover:border-amber-500/30",
                    !activeStore && "border-amber-500/35 bg-amber-500/8"
                  )}
                >
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      All stores
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {money(periodSpendAed, "AED")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {periodPurchases.length} receipt
                      {periodPurchases.length === 1 ? "" : "s"}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {storeSummaries.map((summary) => (
                <Link
                  key={summary.name}
                  href={buildUrl(period, summary.name)}
                  className="group"
                >
                  <Card
                    className={cn(
                      "h-full border-border/60 bg-background/45 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/30",
                      activeStore === summary.name &&
                        "border-amber-500/35 bg-amber-500/8"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {summary.name}
                          </p>
                          <p className="mt-1 text-xl font-semibold">
                            {money(summary.aedSpend, "AED")}
                          </p>
                          {summary.usdSpend > 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {money(summary.usdSpend, "USD")} also recorded
                            </p>
                          ) : null}
                        </div>
                        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {summary.receipts} receipt
                        {summary.receipts === 1 ? "" : "s"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Purchase history
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeStore
                    ? `${visiblePurchases.length} receipt${visiblePurchases.length === 1 ? "" : "s"} from ${activeStore} · ${periodLabel}`
                    : `${visiblePurchases.length} receipt${visiblePurchases.length === 1 ? "" : "s"} · ${periodLabel}`}
                </p>
              </div>

              {activeStore ? (
                <Link
                  href={buildUrl(period)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-fit"
                  )}
                >
                  Show all stores
                </Link>
              ) : null}
            </div>

            {visiblePurchases.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {visiblePurchases.map((purchase) => (
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
            ) : (
              <Card className="border-dashed border-amber-500/20 bg-amber-500/4">
                <CardContent className="py-12 text-center">
                  <Store className="mx-auto size-6 text-amber-500" />
                  <p className="mt-3 font-medium">No receipts in this view</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try another period or choose all stores.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
