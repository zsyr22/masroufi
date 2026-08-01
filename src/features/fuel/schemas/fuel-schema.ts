import { z } from "zod";
import { fuelTypes } from "@/features/fuel/types/fuel";

const numberField = (label: string, max: number) => z.coerce.number({ error: `${label} is required.` }).positive(`${label} must be greater than zero.`).max(max);

export const fuelEntrySchema = z.object({
  accountId: z.string().uuid("Choose an account."),
  stationName: z.enum(["ENOC", "ADNOC", "Emarat"], { error: "Choose a supported station." }),
  fuelType: z.enum(fuelTypes),
  pricePerLiter: numberField("Price per liter", 1000),
  liters: numberField("Liters", 10000),
  total: numberField("Total", 10000000),
  odometerKm: z.union([z.literal(""), z.coerce.number().min(0).max(999999999)]).optional(),
  fuelDate: z.iso.date("Choose a valid date."),
  notes: z.string().trim().max(500).optional(),
}).superRefine((value, ctx) => {
  if (Math.abs(value.pricePerLiter * value.liters - value.total) > 0.03) {
    ctx.addIssue({ code: "custom", path: ["total"], message: "Total must match price per liter × liters." });
  }
});

export type FuelEntryInput = z.infer<typeof fuelEntrySchema>;
