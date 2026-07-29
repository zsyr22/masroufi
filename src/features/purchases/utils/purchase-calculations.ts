import type { PurchaseItemInput } from "@/features/purchases/types/purchase";

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotal(item: Pick<PurchaseItemInput, "quantity" | "unitPrice">): number {
  return roundMoney(item.quantity * item.unitPrice);
}

export function calculatePurchaseTotals(items: PurchaseItemInput[], tax: number, discount: number, deliveryFee = 0) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + calculateLineTotal(item), 0));
  return { subtotal, total: roundMoney(subtotal + tax + deliveryFee - discount) };
}
