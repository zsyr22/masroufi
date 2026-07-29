import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { PurchaseForm } from "@/features/purchases/components/purchase-form";
import { getCurrentUserProducts, getCurrentUserStores } from "@/features/purchases/services/purchase-service";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";

export default async function NewPurchasePage() {
  const [accounts, categories, stores, products] = await Promise.all([getCurrentUserAccounts(), getCurrentUserCategories(), getCurrentUserStores(), getCurrentUserProducts()]);
  if (!accounts.length) redirect("/accounts");
  return <div className="mx-auto max-w-6xl space-y-8"><PageHeader title="New purchase" description="Enter the receipt once, then keep every product, quantity, and price beneath it." /><PurchaseForm accounts={accounts} categories={categories} stores={stores} products={products} /></div>;
}
