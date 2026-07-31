"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { billSchema, payBillSchema, updateBillPaymentSchema } from "@/features/bills/schemas/bill-schema";
import { createClient } from "@/lib/supabase/server";

export type BillState = { message?: string; success?: boolean };
const billIdSchema = z.string().uuid();

function revalidateBillRelatedPaths() {
  const paths = [
    "/bills",
    "/transactions",
    "/accounts",
    "/dashboard",
    "/reports",
  ];

  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function createBill(_: BillState, formData: FormData): Promise<BillState> {
  const parsed = billSchema.safeParse({
    name: formData.get("name"), provider: formData.get("provider") || undefined,
    categoryId: formData.get("categoryId"), accountId: formData.get("accountId") || undefined,
    frequency: formData.get("frequency"), dueDay: formData.get("dueDay") || undefined,
    expectedAmount: formData.get("expectedAmount") || undefined, currency: formData.get("currency"),
  });
  if (!parsed.success) return { message: "Review the bill details." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Please sign in again." };
  const value = parsed.data;
  const { error } = await supabase.from("bills").insert({
    user_id: user.id, name: value.name, provider: value.provider || null,
    category_id: value.categoryId, default_account_id: value.accountId || null,
    frequency: value.frequency, due_day: value.dueDay || null,
    expected_amount: value.expectedAmount ?? null, currency: value.currency,
  });
  if (error) return { message: error.message };
  revalidatePath("/bills");
  return { success: true };
}

export async function updateBill(_: BillState, formData: FormData): Promise<BillState> {
  const id = billIdSchema.safeParse(formData.get("billId"));
  const parsed = billSchema.safeParse({
    name: formData.get("name"), provider: formData.get("provider") || undefined,
    categoryId: formData.get("categoryId"), accountId: formData.get("accountId") || undefined,
    frequency: formData.get("frequency"), dueDay: formData.get("dueDay") || undefined,
    expectedAmount: formData.get("expectedAmount") || undefined, currency: formData.get("currency"),
  });
  if (!id.success || !parsed.success) return { message: "Review the bill details." };

  const supabase = await createClient();
  const value = parsed.data;
  const { error } = await supabase.from("bills").update({
    name: value.name, provider: value.provider || null, category_id: value.categoryId,
    default_account_id: value.accountId || null, frequency: value.frequency,
    due_day: value.dueDay || null, expected_amount: value.expectedAmount ?? null,
    currency: value.currency,
  }).eq("id", id.data);
  if (error) return { message: error.message };
  revalidateBillRelatedPaths();
  return { success: true };
}

export async function archiveBill(billId: string): Promise<BillState> {
  const parsed = billIdSchema.safeParse(billId);
  if (!parsed.success) return { message: "Invalid bill." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Please sign in again." };

  const { error } = await supabase
    .from("bills")
    .update({ is_active: false })
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .eq("is_active", true);
  if (error) return { message: error.message };
  revalidateBillRelatedPaths();
  return { success: true };
}


export async function restoreBill(billId: string): Promise<BillState> {
  const parsed = billIdSchema.safeParse(billId);
  if (!parsed.success) return { message: "Invalid bill." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: "Please sign in again." };

  const { error } = await supabase
    .from("bills")
    .update({ is_active: true })
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { message: error.message };
  revalidateBillRelatedPaths();
  return { success: true };
}

export async function payBill(_: BillState, formData: FormData): Promise<BillState> {
  const parsed = payBillSchema.safeParse({
    billId: formData.get("billId"), accountId: formData.get("accountId"), amount: formData.get("amount"),
    paidAt: formData.get("paidAt"), notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { message: "Review the payment details." };
  const supabase = await createClient();
  const value = parsed.data;
  const { error } = await supabase.rpc("pay_bill", {
    p_bill_id: value.billId, p_account_id: value.accountId, p_amount: value.amount,
    p_paid_at: value.paidAt, p_billing_month: `${value.paidAt.slice(0, 7)}-01`, p_notes: value.notes ?? "",
  });
  if (error) return { message: error.code === "23505" ? "This bill is already paid for that month." : error.message };
  revalidateBillRelatedPaths();
  return { success: true };
}


export async function updateBillPayment(_: BillState, formData: FormData): Promise<BillState> {
  const parsed = updateBillPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    accountId: formData.get("accountId"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { message: "Review the payment details." };

  const supabase = await createClient();
  const value = parsed.data;
  const { error } = await supabase.rpc("update_bill_payment", {
    p_payment_id: value.paymentId,
    p_account_id: value.accountId,
    p_amount: value.amount,
    p_paid_at: value.paidAt,
    p_notes: value.notes ?? "",
  });

  if (error) {
    return {
      message: error.code === "23505"
        ? "This bill is already paid for that month."
        : error.message,
    };
  }

  revalidateBillRelatedPaths();
  return { success: true };
}

export async function deleteBillPayment(paymentId: string): Promise<BillState> {
  const parsed = billIdSchema.safeParse(paymentId);
  if (!parsed.success) return { message: "Invalid bill payment." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_bill_payment", { p_payment_id: parsed.data });
  if (error) return { message: error.message };

  revalidateBillRelatedPaths();
  return { success: true };
}
