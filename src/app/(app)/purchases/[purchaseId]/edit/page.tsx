import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { PurchaseForm } from "@/features/purchases/components/purchase-form";
import { getCurrentUserProducts, getCurrentUserPurchaseById, getCurrentUserStores } from "@/features/purchases/services/purchase-service";
import type { PurchaseFormInitialData } from "@/features/purchases/types/purchase";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";

export default async function EditPurchasePage({ params }: { params: Promise<{ purchaseId: string }> }) {
  const { purchaseId } = await params;
  const [purchase, accounts, categories, stores, products] = await Promise.all([
    getCurrentUserPurchaseById(purchaseId),
    getCurrentUserAccounts(),
    getCurrentUserCategories(),
    getCurrentUserStores(),
    getCurrentUserProducts(),
  ]);

  if (!purchase) notFound();
  if (!accounts.length) redirect("/accounts");

  const initialData: PurchaseFormInitialData = {
    storeId: purchase.store_id,
    channel: purchase.channel,
    branchName: purchase.branch_name ?? "",
    accountId: purchase.account_id,
    categoryId: purchase.category_id,
    purchaseDate: purchase.purchase_date,
    tax: Number(purchase.tax),
    discount: Number(purchase.discount),
    deliveryFee: Number(purchase.delivery_fee),
    total: Number(purchase.total),
    notes: purchase.notes ?? "",
    items: purchase.purchase_items.map((item) => ({
      clientId: item.id,
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unit_price),
      categoryId: item.category_id ?? "",
    })),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Edit purchase"
        description="Update the receipt, its items, and totals from one place. The linked transaction will stay synchronized automatically."
      />
      <PurchaseForm
        accounts={accounts}
        categories={categories}
        stores={stores}
        products={products}
        purchaseId={purchaseId}
        initialData={initialData}
      />
    </div>
  );
}
