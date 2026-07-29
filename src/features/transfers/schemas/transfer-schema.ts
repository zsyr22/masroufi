import { z } from "zod";

export const transferSchema = z
    .object({
        transferId: z
            .string()
            .uuid("The transfer could not be found.")
            .optional(),

        fromAccountId: z
            .string()
            .uuid("Select the source account."),

        toAccountId: z
            .string()
            .uuid("Select the destination account."),

        amount: z.coerce
            .number()
            .positive(
                "Amount must be greater than zero."
            )
            .finite("Enter a valid amount."),

        transferDate: z
            .string()
            .min(
                1,
                "Transfer date is required."
            ),

        notes: z
            .string()
            .trim()
            .max(
                500,
                "Notes cannot exceed 500 characters."
            )
            .optional(),
    })
    .superRefine((data, context) => {
        if (
            data.fromAccountId ===
            data.toAccountId
        ) {
            context.addIssue({
                code: "custom",
                path: ["toAccountId"],
                message:
                    "Choose a different destination account.",
            });
        }
    });

export type TransferInput = z.infer<
    typeof transferSchema
>;