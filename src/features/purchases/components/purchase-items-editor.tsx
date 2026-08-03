"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseItemRow } from "@/features/purchases/components/purchase-item-row";
import type { ProductSuggestion, PurchaseItemInput } from "@/features/purchases/types/purchase";

export function createEmptyPurchaseItem(): PurchaseItemInput {
  return {
    clientId: crypto.randomUUID(),
    name: "",
    quantity: 1,
    unit: "piece",
    packageSize: null,
    packageUnit: null,
    unitPrice: 0,
    categoryId: "",
  };
}

type Props = {
  items: PurchaseItemInput[];
  currency: string;
  products: ProductSuggestion[];
  onChange: (items: PurchaseItemInput[]) => void;
};

export function PurchaseItemsEditor({ items, currency, products, onChange }: Props) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <PurchaseItemRow
          key={item.clientId}
          item={item}
          currency={currency}
          products={products}
          canDelete={items.length > 1}
          onChange={(next) => onChange(items.map((current, currentIndex) => currentIndex === index ? next : current))}
          onDelete={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
        />
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...items, createEmptyPurchaseItem()])}>
        <Plus className="size-4" /> Add item
      </Button>
    </div>
  );
}
