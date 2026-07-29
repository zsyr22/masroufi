import { createClient } from "@/lib/supabase/server";
import type { Bill, BillPaymentHistoryItem } from "@/features/bills/types/bill";

export async function getBills(): Promise<Bill[]> {
  const supabase = await createClient();
  const start = new Date();
  start.setDate(1);
  const month = start.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("bills")
    .select("id,name,provider,category_id,default_account_id,frequency,due_day,expected_amount,currency,bill_payments(id,billing_month,amount,paid_at)")
    .eq("is_active", true)
    .gte("bill_payments.billing_month", month)
    .order("name");

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []) as unknown as Bill[];
}

export async function getBillPaymentHistory(limit = 50): Promise<BillPaymentHistoryItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bill_payments")
    .select(`
      id,
      billing_month,
      amount,
      paid_at,
      notes,
      bill:bills(id,name,provider,currency),
      transaction:transactions(account:accounts(name))
    `)
    .order("paid_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []) as unknown as BillPaymentHistoryItem[];
}
