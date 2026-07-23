import { z } from "zod";

export const createAccountSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Account name is required.")
        .max(100, "Account name is too long."),

    type: z.enum(["bank", "cash", "savings"]),

    currency: z.enum(["AED", "USD"]),

    openingBalance: z.coerce
        .number()
        .finite("Enter a valid balance."),

    isIncludedInAvailableBalance: z.boolean(),
});

export type CreateAccountInput = z.infer<
    typeof createAccountSchema
>;