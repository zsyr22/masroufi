import { createClient } from "@/lib/supabase/server";
import type { Bill, BillPaymentHistoryItem, DashboardBillsData } from "@/features/bills/types/bill";

function currentMonthStart() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

async function getBillsByActiveState(isActive: boolean): Promise<Bill[]> {
  const supabase = await createClient();
  const month = currentMonthStart();

  const { data, error } = await supabase
    .from("bills")
    .select("id,name,provider,category_id,default_account_id,frequency,due_day,expected_amount,currency,is_active,bill_payments(id,billing_month,amount,paid_at)")
    .eq("is_active", isActive)
    .gte("bill_payments.billing_month", month)
    .order("name");

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []) as unknown as Bill[];
}

export function getBills(): Promise<Bill[]> {
  return getBillsByActiveState(true);
}

export function getArchivedBills(): Promise<Bill[]> {
  return getBillsByActiveState(false);
}

export async function getDashboardBillsData(): Promise<DashboardBillsData> {
  const supabase = await createClient();
  const month = currentMonthStart();

  const [{ data: activeBills, error: billsError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase
      .from("bills")
      .select("id,name,due_day,is_active,bill_payments(id,billing_month)")
      .eq("is_active", true)
      .gte("bill_payments.billing_month", month)
      .order("name"),
    supabase
      .from("bill_payments")
      .select("id,bill_id,billing_month,bill:bills(id,name,is_active)")
      .gte("billing_month", month),
  ]);

  if (billsError || paymentsError) {
    console.error(billsError ?? paymentsError);
    return { activeBills: [], paidPayments: [] };
  }

  return {
    activeBills: (activeBills ?? []) as unknown as DashboardBillsData["activeBills"],
    paidPayments: (payments ?? []) as unknown as DashboardBillsData["paidPayments"],
  };
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
      transaction:transactions(id,account_id,account:accounts(name))
    `)
    .order("paid_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []) as unknown as BillPaymentHistoryItem[];
}
