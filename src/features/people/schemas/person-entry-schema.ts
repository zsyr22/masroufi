import { z } from "zod";

export const personEntryTypes = [
    "paid_for_person",
    "person_paid_for_me",
    "repayment_received",
    "repayment_sent",
    "adjustment",
] as const;

export const createPersonEntrySchema = z.object({
    personId: z.string().uuid("Invalid person."),

    entryType: z.enum(personEntryTypes),

    amount: z.coerce
        .number()
        .positive("Amount must be greater than zero.")
        .max(999999999999.99),

    currency: z.enum(["AED", "USD"]),

    entryDate: z
        .string()
        .min(1, "Date is required."),

    description: z
        .string()
        .trim()
        .max(500, "Description is too long.")
        .optional(),
});

export type CreatePersonEntryInput = z.infer<
    typeof createPersonEntrySchema
>;