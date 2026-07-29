"use client";

import { Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  subtotal: number; tax: number; discount: number; deliveryFee: number; showDeliveryFee: boolean;
  receiptTotal: number; currency: string; calculatedTotal: number;
  onTaxChange: (value: number) => void; onDiscountChange: (value: number) => void;
  onDeliveryFeeChange: (value: number) => void; onReceiptTotalChange: (value: number) => void;
};

export function PurchaseTotalsCard(props: Props) {
  const matches = Math.abs(props.calculatedTotal - props.receiptTotal) <= 0.02;
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-orange-500/5 p-5">
      <div className="space-y-4">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items subtotal</span><strong>{props.subtotal.toFixed(2)} {props.currency}</strong></div>
        <div className={`grid gap-4 ${props.showDeliveryFee ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <div className="space-y-2"><Label htmlFor="tax">Tax</Label><Input id="tax" name="tax" type="number" min="0" step="0.01" value={props.tax} onChange={(e) => props.onTaxChange(Number(e.target.value))} /></div>
          {props.showDeliveryFee ? <div className="space-y-2"><Label htmlFor="deliveryFee" className="flex items-center gap-1.5"><Truck className="size-3.5" />Delivery fee</Label><Input id="deliveryFee" name="deliveryFee" type="number" min="0" step="0.01" value={props.deliveryFee} onChange={(e) => props.onDeliveryFeeChange(Number(e.target.value))} /></div> : <input type="hidden" name="deliveryFee" value="0" />}
          <div className="space-y-2"><Label htmlFor="discount">Discount</Label><Input id="discount" name="discount" type="number" min="0" step="0.01" value={props.discount} onChange={(e) => props.onDiscountChange(Number(e.target.value))} /></div>
        </div>
        <div className="border-t border-amber-500/20 pt-4">
          <Label htmlFor="total">Receipt total</Label>
          <div className="relative mt-2"><Input id="total" name="total" type="number" min="0.01" step="0.01" value={props.receiptTotal} onChange={(e) => props.onReceiptTotalChange(Number(e.target.value))} className="h-14 pr-20 text-xl font-bold" /><span className="absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-muted-foreground">{props.currency}</span></div>
          <p className={matches ? "mt-2 text-xs text-emerald-600" : "mt-2 text-xs text-destructive"}>{matches ? "Everything matches perfectly." : `Items, tax and delivery calculate to ${props.calculatedTotal.toFixed(2)} ${props.currency}.`}</p>
        </div>
      </div>
    </div>
  );
}
