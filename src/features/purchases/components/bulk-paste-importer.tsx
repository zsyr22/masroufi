"use client";

import { useMemo, useState } from "react";
import { ClipboardPaste, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProductSuggestion,
  PurchaseItemInput,
} from "@/features/purchases/types/purchase";
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

export function BulkPasteImporter({
  products,
  currency,
  onImportItems,
  onImportTotals,
}: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const parsed = useMemo(
    () => parseReceiptText(text, products),
    [text, products]
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setText("");
    }
  }

  function applyImport() {
    if (!parsed.items.length) {
      return;
    }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <ClipboardPaste className="size-4" />
        Paste receipt
      </DialogTrigger>

      <DialogContent
        className="
    flex
    h-[88dvh]
    w-[92vw]
    !max-w-[1100px]
    flex-col
    overflow-hidden
    p-0
    sm:w-[88vw]
    lg:w-[75vw]
  "
      >        <div className="shrink-0 border-b px-4 py-4 pr-12 sm:px-6">
          <DialogHeader>
            <DialogTitle>Import a long receipt</DialogTitle>

            <DialogDescription>
              Paste copied receipt text from Amazon or Nesto. Masroufi detects the store format automatically and prepares the items for review.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={example}
              className="h-48 min-h-48 resize-none font-mono text-sm"
            />

            <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Import preview</p>
                    {parsed.source !== "unknown" ? (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        {parsed.source === "amazon" ? "Amazon detected" : parsed.source === "nesto" ? "Nesto detected" : "Generic format"}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {parsed.items.length} item
                    {parsed.items.length === 1 ? "" : "s"} detected
                  </p>
                </div>

                {parsed.total !== undefined ? (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Detected receipt total
                    </p>

                    <p className="font-semibold">
                      {parsed.total.toFixed(2)} {currency}
                    </p>
                  </div>
                ) : null}
              </div>

              {parsed.items.length ? (
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {parsed.items.map((item) => {
                    const lineTotal =
                      Number(item.quantity) * Number(item.unitPrice);

                    return (
                      <div
                        key={item.clientId}
                        className="flex items-start justify-between gap-4 rounded-lg border border-border/40 bg-background/70 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Qty {item.quantity}
                            {item.packageSize && item.packageUnit
                              ? ` · ${item.packageSize} ${item.packageUnit}`
                              : ""}
                          </p>
                        </div>

                        <strong className="shrink-0 text-sm">
                          {lineTotal.toFixed(2)} {currency}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">
                    Paste the receipt text to see detected items.
                  </p>

                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    Product | 2 | 15.50
                  </p>
                </div>
              )}

              {parsed.warnings.length ? (
                <div className="mt-3 space-y-1">
                  {parsed.warnings.map((warning) => (
                    <p
                      key={warning}
                      className="text-xs text-amber-600 dark:text-amber-400"
                    >
                      {warning}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Imported items are added to the purchase form first. Amazon and Nesto use separate parsers, so each format is handled independently. Review the result before saving.
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t bg-background/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={!parsed.items.length}
              onClick={applyImport}
            >
              <Sparkles className="size-4" />
              Add{" "}
              {parsed.items.length
                ? `${parsed.items.length} detected items`
                : "detected items"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}