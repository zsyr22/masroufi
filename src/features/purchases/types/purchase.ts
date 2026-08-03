import type { CurrencyCode } from "@/features/accounts/types/account";

export const purchaseUnits = ["piece", "kg", "g", "l", "ml", "pack", "box", "other"] as const;
export type PurchaseUnit = (typeof purchaseUnits)[number];

export type PurchaseItemInput = {
  clientId: string;
  name: string;
  /** Number of purchased units/packages. */
  quantity: number;
  /** How the item was sold: piece, pack, box, kg... */
  unit: PurchaseUnit;
  /** Optional content size of one purchased unit, e.g. 250 g or 330 ml. */
  packageSize: number | null;
  packageUnit: PurchaseUnit | null;
  /** Price of one purchased unit/package, or price per measured unit for loose goods. */
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
  store_id: string;
  account_id: string;
  category_id: string;
  channel: "online" | "physical";
  branch_name: string | null;
  categories: { name: string } | null;
  purchase_items: Array<{
    id: string;
    category_id: string | null;
    name: string;
    quantity: number;
    unit: PurchaseUnit;
    package_size: number | null;
    package_unit: PurchaseUnit | null;
    unit_price: number;
    line_total: number;
  }>;
};

export type PurchaseFormInitialData = {
  storeId: string;
  channel: "online" | "physical";
  branchName: string;
  accountId: string;
  categoryId: string;
  purchaseDate: string;
  tax: number;
  discount: number;
  deliveryFee: number;
  total: number;
  notes: string;
  items: PurchaseItemInput[];
};
