import { PageHeader } from "@/components/shared/page-header";
import { AddStoreDialog } from "@/features/stores/components/add-store-dialog";
import { ArchivedStores } from "@/features/stores/components/archived-stores";
import { StoreList } from "@/features/stores/components/store-list";
import { getArchivedStores, getStores } from "@/features/stores/services/store-service";

export default async function StoresPage(){
  const [stores, archivedStores] = await Promise.all([getStores(), getArchivedStores()]);
  return <div className="space-y-8"><PageHeader title="Stores" description="Manage your reusable shopping destinations and keep purchase data clean." action={<AddStoreDialog/>}/><StoreList stores={stores}/><ArchivedStores stores={archivedStores}/></div>;
}
