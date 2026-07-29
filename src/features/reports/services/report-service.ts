import { createClient } from "@/lib/supabase/server";

export type PurchaseReportRow = {
  id: string;
  purchase_date: string;
  total: number;
  delivery_fee: number;
  currency: "AED" | "USD";
  stores: { name: string } | null;
  purchase_items: Array<{ name: string; line_total: number; quantity: number }>;
};

export async function getPurchaseReportRows(): Promise<PurchaseReportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("id,purchase_date,total,delivery_fee,currency,stores(name),purchase_items(name,line_total,quantity)")
    .order("purchase_date", { ascending: false });

  if (error) {
    console.error("Load purchase report data error:", error);
    return [];
  }

  return (data ?? []) as unknown as PurchaseReportRow[];
}
