"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/features/transactions/types/transaction";
import type { ProductSuggestion, PurchaseItemInput, PurchaseUnit } from "@/features/purchases/types/purchase";
import { calculateLineTotal } from "@/features/purchases/utils/purchase-calculations";

const unitOptions: Array<{ value: PurchaseUnit; label: string }> = [
  { value: "piece", label: "pc" }, { value: "kg", label: "kg" }, { value: "g", label: "g" },
  { value: "l", label: "L" }, { value: "ml", label: "ml" }, { value: "pack", label: "pack" },
  { value: "box", label: "box" }, { value: "other", label: "other" },
];

type Props = {
  item: PurchaseItemInput;
  categories: Category[];
  products: ProductSuggestion[];
  currency: string;
  canDelete: boolean;
  onChange: (next: PurchaseItemInput) => void;
  onDelete: () => void;
};

const fieldClass = "space-y-1.5";
const controlClass = "!h-10 !min-h-10 w-full";

export function PurchaseItemRow({ item, categories, products, currency, canDelete, onChange, onDelete }: Props) {
  const lineTotal = calculateLineTotal(item);
  const selectedCategory = categories.find((category) => category.id === item.categoryId);
  const productListId = `purchase-products-${item.clientId}`;

  function changeProductName(name: string) {
    const existing = products.find((product) => product.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase());
    onChange({
      ...item,
      name,
      unit: existing?.default_unit ?? item.unit,
      categoryId: existing?.default_category_id ?? item.categoryId,
    });
  }

  return (
    <div className="rounded-xl border border-amber-500/10 bg-background/70 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(12rem,2fr)_7rem_7rem_8rem_9rem_2.5rem] lg:items-start">
        <div className={fieldClass}>
          <label htmlFor={`item-${item.clientId}`} className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Item</label>
          <Input id={`item-${item.clientId}`} list={productListId} className={controlClass} value={item.name} onChange={(event) => changeProductName(event.target.value)} placeholder="Search or add a product..." autoComplete="off" />
          <datalist id={productListId}>{products.map((product) => <option key={product.id} value={product.name} />)}</datalist>
        </div>

        <div className={fieldClass}>
          <label htmlFor={`qty-${item.clientId}`} className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Qty</label>
          <Input id={`qty-${item.clientId}`} className={controlClass} type="number" min="0.001" step="0.001" value={item.quantity} onChange={(event) => onChange({ ...item, quantity: Number(event.target.value) })} />
        </div>

        <div className={fieldClass}>
          <label className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Unit</label>
          <Select value={item.unit} onValueChange={(value) => value && onChange({ ...item, unit: value as PurchaseUnit })}>
            <SelectTrigger className={controlClass}><span>{unitOptions.find((unit) => unit.value === item.unit)?.label ?? item.unit}</span><SelectValue className="sr-only" /></SelectTrigger>
            <SelectContent>{unitOptions.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className={fieldClass}>
          <label htmlFor={`price-${item.clientId}`} className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Unit price</label>
          <Input id={`price-${item.clientId}`} className={controlClass} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => onChange({ ...item, unitPrice: Number(event.target.value) })} />
        </div>

        <div className={fieldClass}>
          <span className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Line total</span>
          <div className="flex h-10 min-h-10 items-center rounded-lg bg-amber-500/10 px-3 font-semibold text-amber-700 dark:text-amber-300">{lineTotal.toFixed(2)} {currency}</div>
        </div>

        <div className="pt-[22px]">
          <Button type="button" variant="ghost" size="icon" disabled={!canDelete} onClick={onDelete} aria-label="Delete item" className="!h-10 !w-10 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <Select value={item.categoryId} onValueChange={(value) => onChange({ ...item, categoryId: value ?? "" })}>
          <SelectTrigger className="!h-9 w-full lg:w-64"><span className={selectedCategory ? "" : "text-muted-foreground"}>{selectedCategory?.name ?? "Item category (optional)"}</span><SelectValue className="sr-only" /></SelectTrigger>
          <SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}
