import { z } from "zod";

export const createCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Category name is required.")
        .max(80, "Category name is too long."),

    transactionType: z.enum(["income", "expense"]),
});

export type CreateCategoryInput = z.infer<
    typeof createCategorySchema
>;