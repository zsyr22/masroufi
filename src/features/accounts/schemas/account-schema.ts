import { z } from "zod";

export const accountSchema = z.object({
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

export const createAccountSchema = accountSchema;

export const updateAccountSchema = accountSchema.extend({
    accountId: z.string().uuid("Invalid account."),
});

export type CreateAccountInput = z.infer<
    typeof createAccountSchema
>;

export type UpdateAccountInput = z.infer<
    typeof updateAccountSchema
>;