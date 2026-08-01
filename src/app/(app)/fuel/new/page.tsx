import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { FuelForm } from "@/features/fuel/components/fuel-form";
import {
  getFuelStations,
} from "@/features/fuel/services/fuel-service";
import { getCurrentUaeFuelPrices } from "@/features/fuel/services/uae-fuel-price-service";

export default async function NewFuelPage() {
  const [accounts, stations, fuelPriceResult] = await Promise.all([
    getCurrentUserAccounts(),
    getFuelStations(),
    getCurrentUaeFuelPrices(),
  ]);

  if (!accounts.length) {
    redirect("/accounts");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/fuel"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to fuel
      </Link>

      <PageHeader
        title="Quick add fuel"
        description="Masroufi loads the latest published UAE price automatically."
      />

      <FuelForm
        accounts={accounts}
        stations={stations}
        currentFuelPrices={fuelPriceResult?.prices ?? null}
        fuelPriceSource={fuelPriceResult?.sourceName}
        fuelPricesFetchedAt={fuelPriceResult?.fetchedAt}
      />
    </div>
  );
}
