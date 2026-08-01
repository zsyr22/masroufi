import type { CurrencyCode } from "@/features/accounts/types/account";

export const fuelTypes = ["e_plus_91", "special_95", "super_98", "diesel", "other"] as const;
export type FuelType = (typeof fuelTypes)[number];

export const fuelTypeLabels: Record<FuelType, string> = {
  e_plus_91: "E-Plus 91",
  special_95: "Special 95",
  super_98: "Super 98",
  diesel: "Diesel",
  other: "Other",
};

export type FuelEntry = {
  id: string;
  transaction_id: string;
  account_id: string;
  station_name: string;
  fuel_type: FuelType;
  price_per_liter: number;
  liters: number;
  total: number;
  currency: CurrencyCode;
  odometer_km: number | null;
  fuel_date: string;
  notes: string | null;
  created_at: string;
  accounts: { name: string } | null;
};
