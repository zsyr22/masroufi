"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Droplets,
  Fuel,
  Gauge,
  ListFilter,
  Plus,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StationLogo } from "@/features/fuel/components/station-logo";
import { getFuelStation } from "@/features/fuel/constants/fuel-stations";

import type { FuelEntry, FuelType } from "@/features/fuel/types/fuel";
import { fuelTypeLabels } from "@/features/fuel/types/fuel";

type DateFilter = "all" | "this_month" | "last_month" | "this_year";
type SortOption = "newest" | "oldest" | "highest" | "lowest";

type FuelDashboardProps = {
  entries: FuelEntry[];
};

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

const fuelBadgeClasses: Record<FuelType, string> = {
  e_plus_91: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  special_95:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  super_98:
    "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  diesel: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  other: "border-border bg-muted text-muted-foreground",
};

function getDateParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  };
}

function matchesDateFilter(entryDate: string, filter: DateFilter, now: Date) {
  if (filter === "all") return true;

  const entry = new Date(`${entryDate}T00:00:00`);
  const current = getDateParts(now);
  const entryParts = getDateParts(entry);

  if (filter === "this_month") {
    return entryParts.year === current.year && entryParts.month === current.month;
  }

  if (filter === "last_month") {
    const lastMonth = new Date(current.year, current.month - 1, 1);
    return (
      entryParts.year === lastMonth.getFullYear() &&
      entryParts.month === lastMonth.getMonth()
    );
  }

  return entryParts.year === current.year;
}

export function FuelDashboard({ entries }: FuelDashboardProps) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const now = useMemo(() => new Date(), []);

  const currentMonthEntries = useMemo(
    () => entries.filter((entry) => matchesDateFilter(entry.fuel_date, "this_month", now)),
    [entries, now]
  );

  const monthlySpent = currentMonthEntries.reduce(
    (sum, entry) => sum + (entry.currency === "AED" ? Number(entry.total) : 0),
    0
  );
  const monthlyLiters = currentMonthEntries.reduce(
    (sum, entry) => sum + Number(entry.liters),
    0
  );
  const averagePrice = monthlyLiters > 0 ? monthlySpent / monthlyLiters : 0;
  const lastFillUp = entries[0] ?? null;

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries
      .filter((entry) => {
        const matchesSearch =
          query.length === 0 ||
          entry.station_name.toLowerCase().includes(query) ||
          fuelTypeLabels[entry.fuel_type].toLowerCase().includes(query) ||
          entry.accounts?.name?.toLowerCase().includes(query) ||
          String(entry.odometer_km ?? "").includes(query);

        return matchesSearch && matchesDateFilter(entry.fuel_date, dateFilter, now);
      })
      .sort((a, b) => {
        if (sort === "highest") return Number(b.total) - Number(a.total);
        if (sort === "lowest") return Number(a.total) - Number(b.total);

        const aTime = new Date(`${a.fuel_date}T00:00:00`).getTime();
        const bTime = new Date(`${b.fuel_date}T00:00:00`).getTime();

        return sort === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }, [dateFilter, entries, now, search, sort]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Fuel"
        description="Track every fill-up, fuel price, liters and odometer."
        action={
          <Link href="/fuel/new" className={buttonVariants()}>
            <Plus className="size-4" />
            Add fill-up
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <StatCard
          title="This month"
          value={`${monthlySpent.toFixed(2)} AED`}
          description={`${currentMonthEntries.length} fill-ups`}
          icon={Fuel}
          tone="success"
        />
        <StatCard
          title="Fuel used"
          value={`${monthlyLiters.toFixed(1)} L`}
          description="This month"
          icon={Droplets}
        />
        <StatCard
          title="Average price"
          value={`${averagePrice.toFixed(3)} AED/L`}
          description="Weighted average"
          icon={Gauge}
        />
        <StatCard
          title="Total fill-ups"
          value={String(entries.length)}
          description="All recorded entries"
          icon={ListFilter}
        />
        <StatCard
          title="Last fill-up"
          value={lastFillUp ? money(lastFillUp.total, lastFillUp.currency) : "—"}
          description={lastFillUp ? `${lastFillUp.station_name} · ${formatDate(lastFillUp.fuel_date)}` : "No entries yet"}
          icon={CalendarDays}
        />
      </section>

      {entries.length === 0 ? (
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-transparent">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
              <Fuel className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">No fuel entries yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Track every fill-up and know exactly how much your car costs.
            </p>
            <Link href="/fuel/new" className={`${buttonVariants()} mt-5`}>
              <Plus className="size-4" />
              Add first fill-up
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_180px_170px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search station, fuel type, account or odometer..."
                  className="h-10 pl-9"
                />
              </div>

              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="this_month">This month</SelectItem>
                  <SelectItem value="last_month">Last month</SelectItem>
                  <SelectItem value="this_year">This year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="highest">Highest cost</SelectItem>
                  <SelectItem value="lowest">Lowest cost</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="flex items-end justify-between gap-3 pt-1">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Fuel history
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {visibleEntries.length} of {entries.length} entries
              </p>
            </div>
          </div>

          {visibleEntries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Search className="size-8 text-muted-foreground" />
                <h2 className="mt-3 font-semibold">No matching fill-ups</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another search term or date filter.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleEntries.map((entry) => {
                const station = getFuelStation(entry.station_name);

                return (
                  <Link key={entry.id} href={`/fuel/${entry.id}`}>
                    <Card className="group h-full overflow-hidden border-border/70 bg-card/80 transition hover:-translate-y-0.5 hover:shadow-lg" style={{ borderColor: `${station.brand_color}40` }}>
                      <CardContent className="flex items-center gap-5 p-5 sm:p-6">
                        <StationLogo
                          stationName={entry.station_name}
                          className="h-14 w-20 shrink-0 sm:h-16 sm:w-24"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h2 className="truncate font-semibold">{entry.station_name}</h2>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDate(entry.fuel_date)} · {Number(entry.liters).toFixed(2)} L
                              </p>
                            </div>
                            <strong className="shrink-0 text-base font-semibold sm:text-lg">
                              {money(entry.total, entry.currency)}
                            </strong>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={fuelBadgeClasses[entry.fuel_type]}>
                              {fuelTypeLabels[entry.fuel_type]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Number(entry.price_per_liter).toFixed(3)} {entry.currency}/L
                            </span>
                            {entry.accounts?.name ? (
                              <span className="text-xs text-muted-foreground">· {entry.accounts.name}</span>
                            ) : null}
                            {entry.odometer_km !== null ? (
                              <span className="text-xs text-muted-foreground">
                                · {Number(entry.odometer_km).toLocaleString("en-US")} km
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
