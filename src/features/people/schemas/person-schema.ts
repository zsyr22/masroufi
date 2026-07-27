import { z } from "zod";

export const createPersonSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required.")
        .max(100),

    phone: z
        .string()
        .trim()
        .max(30)
        .optional(),

    notes: z
        .string()
        .trim()
        .max(500)
        .optional(),
});

export type CreatePersonInput =
    z.infer<typeof createPersonSchema>;