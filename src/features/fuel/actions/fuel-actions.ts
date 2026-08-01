"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fuelEntrySchema } from "@/features/fuel/schemas/fuel-schema";
import { createClient } from "@/lib/supabase/server";

export type FuelActionState = { message?: string; fieldErrors?: Record<string, string[]> };

function parse(formData: FormData) {
  const result = fuelEntrySchema.safeParse({
    accountId: formData.get("accountId"), stationName: formData.get("stationName"), fuelType: formData.get("fuelType"),
    pricePerLiter: formData.get("pricePerLiter"), liters: formData.get("liters"), total: formData.get("total"),
    odometerKm: formData.get("odometerKm") ?? "", fuelDate: formData.get("fuelDate"), notes: formData.get("notes") || undefined,
  });
  if (!result.success) return { success: false as const, state: { message: "Please review the highlighted fields.", fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> } };
  return { success: true as const, data: result.data };
}

function refresh(id?: string) {
  ["/fuel", "/transactions", "/accounts", "/dashboard", "/reports"].forEach((path) => revalidatePath(path));
  if (id) revalidatePath(`/fuel/${id}`);
}

export async function createFuelEntry(_state: FuelActionState, formData: FormData): Promise<FuelActionState> {
  const parsed = parse(formData); if (!parsed.success) return parsed.state;
  const supabase = await createClient();
  const input = parsed.data;
  const { data, error } = await supabase.rpc("create_fuel_entry", {
    p_account_id: input.accountId, p_station_name: input.stationName, p_fuel_type: input.fuelType,
    p_price_per_liter: input.pricePerLiter, p_liters: input.liters, p_total: input.total,
    p_odometer_km: input.odometerKm === "" || input.odometerKm === undefined ? null : input.odometerKm,
    p_fuel_date: input.fuelDate, p_notes: input.notes ?? "",
  });
  if (error || !data) { console.error("Create fuel entry error:", error); return { message: error?.message ?? "Fuel entry could not be saved." }; }
  refresh(data); redirect(`/fuel/${data}`);
}

export async function updateFuelEntry(_state: FuelActionState, formData: FormData): Promise<FuelActionState> {
  const id = String(formData.get("fuelId") ?? "");
  const parsed = parse(formData); if (!parsed.success) return parsed.state;
  const supabase = await createClient(); const input = parsed.data;
  const { error } = await supabase.rpc("update_fuel_entry", {
    p_fuel_id: id, p_account_id: input.accountId, p_station_name: input.stationName, p_fuel_type: input.fuelType,
    p_price_per_liter: input.pricePerLiter, p_liters: input.liters, p_total: input.total,
    p_odometer_km: input.odometerKm === "" || input.odometerKm === undefined ? null : input.odometerKm,
    p_fuel_date: input.fuelDate, p_notes: input.notes ?? "",
  });
  if (error) { console.error("Update fuel entry error:", error); return { message: error.message }; }
  refresh(id); redirect(`/fuel/${id}`);
}

export async function deleteFuelEntry(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.from("fuel_entries").select("transaction_id").eq("id", id).maybeSingle();
  if (!data) return { success: false, message: "Fuel entry not found." };
  const { error } = await supabase.from("transactions").delete().eq("id", data.transaction_id);
  if (error) return { success: false, message: error.message };
  refresh(); return { success: true };
}
