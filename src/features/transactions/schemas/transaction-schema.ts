import { z } from "zod";

const personRelationshipSchema = z.enum([
    "paid_for_person",
    "repayment_received",
    "repayment_sent",
]);

const booleanFromFormData = z.preprocess(
    (value) => value === true || value === "true",
    z.boolean()
);

export const createTransactionSchema = z
    .object({
        type: z.enum(["income", "expense"]),

        amount: z.coerce
            .number()
            .positive("Amount must be greater than zero.")
            .finite("Enter a valid amount."),

        accountId: z
            .string()
            .uuid("Select an account."),

        categoryId: z
            .string()
            .uuid("Select a category."),

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
            .max(
                500,
                "Notes cannot exceed 500 characters."
            )
            .optional(),

        involvesPerson: booleanFromFormData,

        personId: z
            .string()
            .uuid("Select a person.")
            .optional(),

        personRelationship:
            personRelationshipSchema.optional(),
    })
    .superRefine((data, context) => {
        if (!data.involvesPerson) {
            return;
        }

        if (!data.personId) {
            context.addIssue({
                code: "custom",
                path: ["personId"],
                message: "Select a person.",
            });
        }

        if (!data.personRelationship) {
            context.addIssue({
                code: "custom",
                path: ["personRelationship"],
                message:
                    "Select how this transaction affects the balance.",
            });

            return;
        }

        if (
            data.type === "income" &&
            data.personRelationship !==
            "repayment_received"
        ) {
            context.addIssue({
                code: "custom",
                path: ["personRelationship"],
                message:
                    "Income involving a person must be a repayment received.",
            });
        }

        if (
            data.type === "expense" &&
            data.personRelationship ===
            "repayment_received"
        ) {
            context.addIssue({
                code: "custom",
                path: ["personRelationship"],
                message:
                    "An expense cannot be a repayment received.",
            });
        }
    });

export type CreateTransactionInput = z.infer<
    typeof createTransactionSchema
>;