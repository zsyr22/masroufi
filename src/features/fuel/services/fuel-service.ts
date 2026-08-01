import { createClient } from "@/lib/supabase/server";
import type { FuelEntry } from "@/features/fuel/types/fuel";
import type { FuelStation } from "@/features/fuel/constants/fuel-stations";
import { fallbackFuelStations } from "@/features/fuel/constants/fuel-stations";

const selectFields =
  "id,transaction_id,account_id,station_name,fuel_type,price_per_liter,liters,total,currency,odometer_km,fuel_date,notes,created_at,accounts(name)";

export async function getFuelEntries(): Promise<FuelEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fuel_entries")
    .select(selectFields)
    .order("fuel_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Load fuel entries error:",
      JSON.stringify(error, null, 2)
    );

    return [];
  }

  return (data ?? []) as unknown as FuelEntry[];
}

export async function getFuelEntryById(
  id: string
): Promise<FuelEntry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fuel_entries")
    .select(selectFields)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "Load fuel entry error:",
      JSON.stringify(error, null, 2)
    );

    return null;
  }

  return data as unknown as FuelEntry | null;
}

export async function getFuelStations(): Promise<FuelStation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fuel_stations")
    .select("id,name,slug,logo_path,brand_color")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Load fuel stations error:", JSON.stringify(error, null, 2));
    return fallbackFuelStations;
  }

  return (data?.length ? data : fallbackFuelStations) as FuelStation[];
}
