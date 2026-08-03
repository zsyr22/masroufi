"use client";

import { useMemo, useState } from "react";
import { ClipboardPaste, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ProductSuggestion, PurchaseItemInput } from "@/features/purchases/types/purchase";
import { parseReceiptText } from "@/features/purchases/utils/receipt-text-parser";

const example = `Barbican Malt Beverage
330ml, Pack of 6 · 1 unit
AED 29.29

Oman Chilli Flavor Chips
15g · 2 units
AED 1.20

Items total AED 30.49
Discounts & offers -AED 5.00
You pay AED 25.49`;

type Props = {
  products: ProductSuggestion[];
  currency: string;
  onImportItems: (items: PurchaseItemInput[]) => void;
  onImportTotals: (values: {
    tax?: number;
    discount?: number;
    deliveryFee?: number;
    total?: number;
  }) => void;
};

export function BulkPasteImporter({ products, currency, onImportItems, onImportTotals }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const parsed = useMemo(() => parseReceiptText(text, products), [text, products]);

  function applyImport() {
    if (!parsed.items.length) return;
    onImportItems(parsed.items);
    onImportTotals({
      tax: parsed.tax,
      discount: parsed.discount,
      deliveryFee: parsed.deliveryFee,
      total: parsed.total,
    });
    setOpen(false);
    setText("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <ClipboardPaste className="size-4" />
        Paste receipt
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <FileText className="size-4" />
            </span>
            Import a long receipt
          </DialogTitle>
          <DialogDescription>
            Copy the order text from Amazon, Carrefour, or another store and paste it below. Masroufi will prepare the items for review before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={12}
            placeholder={example}
            className="font-mono text-xs"
          />

          <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Import preview</p>
                <p className="text-xs text-muted-foreground">
                  {parsed.items.length} item{parsed.items.length === 1 ? "" : "s"} detected
                </p>
              </div>
              {parsed.total !== undefined ? (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Detected receipt total</p>
                  <p className="font-semibold">{parsed.total.toFixed(2)} {currency}</p>
                </div>
              ) : null}
            </div>

            {parsed.items.length ? (
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                {parsed.items.map((item) => (
                  <div key={item.clientId} className="flex items-start justify-between gap-4 rounded-lg bg-background/70 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit}
                        {item.packageSize && item.packageUnit ? ` · ${item.packageSize} ${item.packageUnit} each` : ""}
                      </p>
                    </div>
                    <strong className="shrink-0 text-sm">{(item.quantity * item.unitPrice).toFixed(2)} {currency}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Paste the receipt text to see detected items. You can also use one line per item:
                <span className="mt-1 block font-mono text-xs">Product | 2 | 15.50</span>
              </p>
            )}

            {parsed.warnings.map((warning) => (
              <p key={warning} className="mt-3 text-xs text-amber-600 dark:text-amber-400">{warning}</p>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Imported items are not saved immediately. They are added to the purchase form so you can correct names, quantities, package sizes, package details and totals first.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" disabled={!parsed.items.length} onClick={applyImport}>
            <Sparkles className="size-4" />
            Add {parsed.items.length || ""} detected items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
