import { z } from "zod";

export const createTransactionSchema = z.object({
    type: z.enum(["income", "expense"]),

    amount: z.coerce
        .number()
        .positive("Amount must be greater than zero.")
        .finite("Enter a valid amount."),

    accountId: z.string().uuid("Select an account."),

    categoryId: z.string().uuid("Select a category."),

    payeeName: z
        .string()
        .trim()
        .max(100, "Payee name is too long.")
        .optional(),

    payeeType: z.enum([
        "store",
        "restaurant",
        "company",
        "government",
        "person",
        "other",
    ]),

    transactionDate: z
        .string()
        .min(1, "Transaction date is required."),

    notes: z
        .string()
        .trim()
        .max(500, "Notes cannot exceed 500 characters.")
        .optional(),
});

export type CreateTransactionInput = z.infer<
    typeof createTransactionSchema
>;