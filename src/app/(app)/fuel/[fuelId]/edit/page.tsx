import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { FuelForm } from "@/features/fuel/components/fuel-form";
import {
  getFuelEntryById,
  getFuelStations,
} from "@/features/fuel/services/fuel-service";
import { getCurrentUaeFuelPrices } from "@/features/fuel/services/uae-fuel-price-service";

export default async function EditFuelPage({
  params,
}: {
  params: Promise<{ fuelId: string }>;
}) {
  const { fuelId } = await params;

  const [entry, accounts, stations, fuelPriceResult] = await Promise.all([
    getFuelEntryById(fuelId),
    getCurrentUserAccounts(),
    getFuelStations(),
    getCurrentUaeFuelPrices(),
  ]);

  if (!entry) {
    notFound();
  }

  if (!accounts.length) {
    redirect("/accounts");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/fuel/${fuelId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to fuel details
      </Link>

      <PageHeader
        title="Edit fuel entry"
        description="Historical entries keep the price originally recorded."
      />

      <FuelForm
        accounts={accounts}
        stations={stations}
        initialValues={entry}
        currentFuelPrices={fuelPriceResult?.prices ?? null}
        fuelPriceSource={fuelPriceResult?.sourceName}
        fuelPricesFetchedAt={fuelPriceResult?.fetchedAt}
      />
    </div>
  );
}
