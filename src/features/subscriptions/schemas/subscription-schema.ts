import { z } from "zod";

import {
    subscriptionBillingCycles,
    subscriptionDurationTypes,
    subscriptionStatuses,
} from "@/features/subscriptions/types/subscription";

const nullableUuidSchema = z.preprocess(
    (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        return value;
    },
    z.string().uuid().nullable()
);

const optionalPositiveIntegerSchema = z.preprocess(
    (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        return value;
    },
    z.coerce
        .number()
        .int()
        .positive()
        .nullable()
);

const formBooleanSchema = z.preprocess(
    (value) => value === "true" || value === true,
    z.boolean()
);

export const subscriptionSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "Subscription name is required.")
            .max(100, "Subscription name is too long."),

        provider: z
            .string()
            .trim()
            .max(100, "Provider name is too long.")
            .optional()
            .transform((value) => value || null),

        amount: z.coerce
            .number()
            .positive("Amount must be greater than zero.")
            .finite("Enter a valid amount."),

        currency: z.enum(["AED", "USD"]),

        billingCycle: z.enum(
            subscriptionBillingCycles
        ),

        startDate: z
            .string()
            .date("Enter a valid start date."),

        nextPaymentDate: z
            .string()
            .date("Enter a valid next payment date."),

        durationType: z.enum(
            subscriptionDurationTypes
        ),

        durationMonths:
            optionalPositiveIntegerSchema,

        totalPayments:
            optionalPositiveIntegerSchema,

        autoRenew: formBooleanSchema,

        accountId: nullableUuidSchema,

        categoryId: nullableUuidSchema,

        notes: z
            .string()
            .trim()
            .max(
                500,
                "Notes cannot exceed 500 characters."
            )
            .optional()
            .transform((value) => value || null),
    })
    .superRefine((data, context) => {
        if (
            data.durationType === "fixed_period" &&
            !data.durationMonths
        ) {
            context.addIssue({
                code: "custom",
                path: ["durationMonths"],
                message:
                    "Enter the contract duration in months.",
            });
        }

        if (
            data.durationType === "payment_count" &&
            !data.totalPayments
        ) {
            context.addIssue({
                code: "custom",
                path: ["totalPayments"],
                message:
                    "Enter the total number of payments.",
            });
        }

        if (
            data.billingCycle === "one_time" &&
            data.durationType === "payment_count" &&
            data.totalPayments !== 1
        ) {
            context.addIssue({
                code: "custom",
                path: ["totalPayments"],
                message:
                    "A one-time payment can only have one payment.",
            });
        }
    });

export const createSubscriptionSchema =
    subscriptionSchema;

export const updateSubscriptionSchema =
    subscriptionSchema.extend({
        subscriptionId: z
            .string()
            .uuid("Invalid subscription."),
    });

export const changeSubscriptionStatusSchema =
    z.object({
        subscriptionId: z
            .string()
            .uuid("Invalid subscription."),

        status: z.enum(subscriptionStatuses),
    });

export const deleteSubscriptionSchema =
    z.object({
        subscriptionId: z
            .string()
            .uuid("Invalid subscription."),
    });

export const recordSubscriptionPaymentSchema =
    z.object({
        subscriptionId: z
            .string()
            .uuid("Invalid subscription."),

        paymentDate: z
            .string()
            .date("Enter a valid payment date."),
    });