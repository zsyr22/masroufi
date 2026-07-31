import { createClient } from "@/lib/supabase/server";
import type { Store } from "@/features/stores/types/store";

async function getStoresByActiveState(isActive: boolean): Promise<Store[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stores").select("id,name,default_channel,website,notes,is_favorite,is_active").eq("is_active", isActive).order("is_favorite", { ascending: false }).order("name");
  if (error) { console.error(error); return []; }
  return (data ?? []) as Store[];
}

export function getStores(): Promise<Store[]> { return getStoresByActiveState(true); }
export function getArchivedStores(): Promise<Store[]> { return getStoresByActiveState(false); }
