import { Building2, Globe2, Store } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AddStoreDialog } from "@/features/stores/components/add-store-dialog";
import { ArchivedStores } from "@/features/stores/components/archived-stores";
import { StoreList } from "@/features/stores/components/store-list";
import { getArchivedStores, getStores } from "@/features/stores/services/store-service";

export default async function StoresPage() {
  const [stores, archivedStores] = await Promise.all([
    getStores(),
    getArchivedStores(),
  ]);
  const onlineStores = stores.filter((store) => store.default_channel === "online").length;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Stores"
        description="Manage reusable shopping destinations and keep purchase data clean."
        action={<AddStoreDialog />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Active stores"
          value={String(stores.length)}
          description="Available for new purchases"
          icon={Store}
          tone="warning"
        />
        <StatCard
          title="Online stores"
          value={String(onlineStores)}
          description="Web and delivery purchases"
          icon={Globe2}
        />
        <StatCard
          title="Archived"
          value={String(archivedStores.length)}
          description="Hidden from new purchase forms"
          icon={Building2}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Your stores</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A clean master list for every receipt and price comparison.
          </p>
        </div>
        <StoreList stores={stores} />
      </section>

      <ArchivedStores stores={archivedStores} />
    </div>
  );
}
