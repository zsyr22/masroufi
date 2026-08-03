"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductSuggestion, PurchaseItemInput, PurchaseUnit } from "@/features/purchases/types/purchase";
import { calculateLineTotal } from "@/features/purchases/utils/purchase-calculations";

const packageUnitOptions: Array<{ value: PurchaseUnit; label: string }> = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "L" },
  { value: "piece", label: "pcs" },
  { value: "pack", label: "packs" },
  { value: "box", label: "boxes" },
  { value: "other", label: "other" },
];

type Props = {
  item: PurchaseItemInput;
  products: ProductSuggestion[];
  currency: string;
  canDelete: boolean;
  onChange: (next: PurchaseItemInput) => void;
  onDelete: () => void;
};

const fieldClass = "space-y-1.5";
const controlClass = "!h-10 !min-h-10 w-full";

export function PurchaseItemRow({ item, products, currency, canDelete, onChange, onDelete }: Props) {
  const lineTotal = calculateLineTotal(item);
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
      <div className="grid gap-3 md:grid-cols-[minmax(12rem,2fr)_5.5rem_8rem_9rem_2.5rem] md:items-start">
        <div className={fieldClass}>
          <label htmlFor={`item-${item.clientId}`} className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Item</label>
          <Input id={`item-${item.clientId}`} list={productListId} className={controlClass} value={item.name} onChange={(event) => changeProductName(event.target.value)} placeholder="Product name" autoComplete="off" />
          <datalist id={productListId}>{products.map((product) => <option key={product.id} value={product.name} />)}</datalist>
        </div>

        <div className={fieldClass}>
          <label htmlFor={`qty-${item.clientId}`} className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Qty</label>
          <Input id={`qty-${item.clientId}`} className={controlClass} type="number" min="0.001" step="0.001" value={item.quantity} onChange={(event) => onChange({ ...item, quantity: Number(event.target.value) })} />
        </div>

        <div className={fieldClass}>
          <label htmlFor={`price-${item.clientId}`} className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Price each</label>
          <Input id={`price-${item.clientId}`} className={controlClass} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => onChange({ ...item, unitPrice: Number(event.target.value) })} />
        </div>

        <div className={fieldClass}>
          <span className="block h-4 text-xs font-medium leading-4 text-muted-foreground">Total</span>
          <div className="flex h-10 min-h-10 items-center rounded-lg bg-amber-500/10 px-3 font-semibold text-amber-700 dark:text-amber-300">{lineTotal.toFixed(2)} {currency}</div>
        </div>

        <div className="pt-[22px]">
          <Button type="button" variant="ghost" size="icon" disabled={!canDelete} onClick={onDelete} aria-label="Delete item" className="!h-10 !w-10 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-border/50 pt-3">
        <div className="space-y-1.5">
          <label htmlFor={`size-${item.clientId}`} className="text-xs font-medium text-muted-foreground">Package size <span className="font-normal">optional</span></label>
          <div className="flex gap-2">
            <Input
              id={`size-${item.clientId}`}
              className="!h-9 w-28"
              type="number"
              min="0"
              step="0.001"
              value={item.packageSize ?? ""}
              placeholder="250"
              onChange={(event) => onChange({ ...item, packageSize: event.target.value ? Number(event.target.value) : null })}
            />
            <Select value={item.packageUnit ?? "none"} onValueChange={(value) => onChange({ ...item, packageUnit: value === "none" || !value ? null : value as PurchaseUnit })}>
              <SelectTrigger className="!h-9 w-28"><span>{item.packageUnit ? packageUnitOptions.find((unit) => unit.value === item.packageUnit)?.label : "unit"}</span><SelectValue className="sr-only" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No size</SelectItem>
                {packageUnitOptions.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="pb-2 text-xs text-muted-foreground">Example: Qty 1, package 250 g, price 8 AED = total 8 AED.</p>
      </div>
    </div>
  );
}
