import type { CurrencyCode } from "@/features/accounts/types/account";

export const purchaseUnits = ["piece", "kg", "g", "l", "ml", "pack", "box", "other"] as const;
export type PurchaseUnit = (typeof purchaseUnits)[number];

export type PurchaseItemInput = {
  clientId: string;
  name: string;
  quantity: number;
  unit: PurchaseUnit;
  unitPrice: number;
  categoryId: string;
};

export type ProductSuggestion = {
  id: string;
  name: string;
  default_category_id: string | null;
  default_unit: PurchaseUnit;
};

export type Store = {
  id: string;
  name: string;
  default_channel: "online" | "physical";
  website: string | null;
  is_favorite: boolean;
};

export type PurchaseListItem = {
  id: string;
  purchase_date: string;
  subtotal: number;
  tax: number;
  discount: number;
  delivery_fee: number;
  total: number;
  currency: CurrencyCode;
  notes: string | null;
  stores: { name: string; branch: string | null } | null;
  accounts: { name: string } | null;
  purchase_items: { count: number }[];
};

export type PurchaseDetails = Omit<PurchaseListItem, "purchase_items"> & {
  transaction_id: string;
  categories: { name: string } | null;
  purchase_items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: PurchaseUnit;
    unit_price: number;
    line_total: number;
  }>;
};
