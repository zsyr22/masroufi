import type { ProductSuggestion, PurchaseDetails, PurchaseListItem, Store } from "@/features/purchases/types/purchase";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserStores(): Promise<Store[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stores").select("id,name,default_channel,website,is_favorite").eq("is_active", true).order("is_favorite", { ascending: false }).order("name");
  if (error) { console.error("Load stores error:", error); return []; }
  return (data ?? []) as Store[];
}

export async function getCurrentUserProducts(): Promise<ProductSuggestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products")
    .select("id,name,default_category_id,default_unit")
    .eq("is_active", true)
    .order("name");
  if (error) { console.error("Load products error:", error); return []; }
  return (data ?? []) as ProductSuggestion[];
}

export async function getCurrentUserPurchases(): Promise<PurchaseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("purchases")
    .select("id,purchase_date,subtotal,tax,discount,delivery_fee,total,currency,notes,stores(name,branch),accounts(name),purchase_items(count)")
    .order("purchase_date", { ascending: false }).order("created_at", { ascending: false });
  if (error) { console.error("Load purchases error:", error); return []; }
  return (data ?? []) as unknown as PurchaseListItem[];
}

export async function getCurrentUserPurchaseById(id: string): Promise<PurchaseDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("purchases")
    .select("id,transaction_id,store_id,account_id,category_id,channel,branch_name,purchase_date,subtotal,tax,discount,delivery_fee,total,currency,notes,stores(name,branch),accounts(name),categories(name),purchase_items(id,category_id,name,quantity,unit,unit_price,line_total)")
    .eq("id", id).order("created_at", { referencedTable: "purchase_items", ascending: true }).maybeSingle();
  if (error) { console.error("Load purchase error:", error); return null; }
  return data as unknown as PurchaseDetails | null;
}
