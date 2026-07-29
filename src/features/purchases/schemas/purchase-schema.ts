import { z } from "zod";
import { purchaseUnits } from "@/features/purchases/types/purchase";

const money = z.coerce.number().finite().min(0).max(999999999);

export const purchaseItemSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1, "Enter an item name.").max(140),
  quantity: z.coerce.number().positive("Quantity must be greater than zero.").max(999999),
  unit: z.enum(purchaseUnits),
  unitPrice: money,
  categoryId: z.string().uuid().or(z.literal("")),
});

export const createPurchaseSchema = z.object({
  storeId: z.string().uuid("Select a store."),
  channel: z.enum(["online", "physical"]),
  branchName: z.string().trim().max(100).optional(),
  accountId: z.string().uuid("Select an account."),
  categoryId: z.string().uuid("Select a category."),
  purchaseDate: z.iso.date(),
  tax: money,
  discount: money,
  deliveryFee: money,
  total: z.coerce.number().positive("Total must be greater than zero."),
  notes: z.string().trim().max(500).optional(),
  items: z.array(purchaseItemSchema).min(1, "Add at least one item.").max(200),
}).superRefine((value, context) => {
  const subtotal = value.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const calculated = Math.round((subtotal + value.tax + value.deliveryFee - value.discount) * 100) / 100;
  if (Math.abs(calculated - value.total) > 0.02) {
    context.addIssue({ code: "custom", path: ["total"], message: `Calculated total is ${calculated.toFixed(2)}.` });
  }
});
