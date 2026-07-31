"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
    changeSubscriptionStatusSchema,
    createSubscriptionSchema,
    subscriptionPaymentSchema,
    updateSubscriptionPaymentSchema,
    updateSubscriptionSchema,
} from "@/features/subscriptions/schemas/subscription-schema";

import type {
    SubscriptionBillingCycle,
    SubscriptionDurationType,
} from "@/features/subscriptions/types/subscription";
import {
    calculateContractEndDate,
} from "@/features/subscriptions/utils/subscription-utils";
import { createClient } from "@/lib/supabase/server";

export type SubscriptionActionState = {
    success?: boolean;
    message?: string;
    fieldErrors?: Record<
        string,
        string[] | undefined
    >;
};

function getFormString(
    formData: FormData,
    key: string
): string {
    const value = formData.get(key);

    return typeof value === "string"
        ? value
        : "";
}

function calculateSubscriptionEndDate({
    startDate,
    durationType,
    durationMonths,
}: {
    startDate: string;
    durationType: SubscriptionDurationType;
    durationMonths: number | null;
}): string | null {
    if (
        durationType !== "fixed_period" ||
        !durationMonths
    ) {
        return null;
    }

    return calculateContractEndDate(
        startDate,
        durationMonths
    );
}

function getSubscriptionPayload(
    input: {
        name: string;
        provider: string | null;
        amount: number;
        currency: "AED" | "USD";
        billingCycle: SubscriptionBillingCycle;
        startDate: string;
        nextPaymentDate: string;
        durationType: SubscriptionDurationType;
        durationMonths: number | null;
        totalPayments: number | null;
        autoRenew: boolean;
        accountId: string | null;
        categoryId: string | null;
        notes: string | null;
    }
) {
    const endDate =
        calculateSubscriptionEndDate({
            startDate: input.startDate,
            durationType:
                input.durationType,
            durationMonths:
                input.durationMonths,
        });

    return {
        name: input.name,
        provider: input.provider,
        amount: input.amount,
        currency: input.currency,

        billing_cycle:
            input.billingCycle,

        start_date: input.startDate,
        next_payment_date:
            input.nextPaymentDate,

        duration_type:
            input.durationType,

        duration_months:
            input.durationType ===
                "fixed_period"
                ? input.durationMonths
                : null,

        end_date: endDate,

        total_payments:
            input.durationType ===
                "payment_count"
                ? input.totalPayments
                : null,

        auto_renew: input.autoRenew,

        account_id: input.accountId,
        category_id: input.categoryId,

        notes: input.notes,
    };
}

export async function createSubscription(
    _previousState: SubscriptionActionState,
    formData: FormData
): Promise<SubscriptionActionState> {
    const parsed =
        createSubscriptionSchema.safeParse({
            name: getFormString(
                formData,
                "name"
            ),

            provider: getFormString(
                formData,
                "provider"
            ),

            amount: getFormString(
                formData,
                "amount"
            ),

            currency: getFormString(
                formData,
                "currency"
            ),

            billingCycle: getFormString(
                formData,
                "billingCycle"
            ),

            startDate: getFormString(
                formData,
                "startDate"
            ),

            nextPaymentDate:
                getFormString(
                    formData,
                    "nextPaymentDate"
                ),

            durationType: getFormString(
                formData,
                "durationType"
            ),

            durationMonths:
                getFormString(
                    formData,
                    "durationMonths"
                ),

            totalPayments:
                getFormString(
                    formData,
                    "totalPayments"
                ),

            autoRenew: getFormString(
                formData,
                "autoRenew"
            ),

            accountId: getFormString(
                formData,
                "accountId"
            ),

            categoryId: getFormString(
                formData,
                "categoryId"
            ),

            notes: getFormString(
                formData,
                "notes"
            ),
        });

    if (!parsed.success) {
        console.error(
            "Create subscription validation error:",
            parsed.error.flatten()
        );

        return {
            success: false,
            message:
                "Please check the subscription details.",
            fieldErrors:
                parsed.error.flatten()
                    .fieldErrors,
        };
    }

    const supabase =
        await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            success: false,
            message:
                "You must be logged in to add a subscription.",
        };
    }

    const payload =
        getSubscriptionPayload(
            parsed.data
        );

    const { error } = await supabase
        .from("subscriptions")
        .insert({
            user_id: user.id,
            ...payload,
            status: "active",
            payments_made: 0,
        });

    if (error) {
        console.error(
            "Create subscription error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return {
            success: false,
            message:
                "Could not create the subscription.",
        };
    }

    revalidatePath(
        "/subscriptions"
    );
    revalidatePath("/dashboard");

    redirect("/subscriptions");
}

export async function updateSubscription(
    _previousState: SubscriptionActionState,
    formData: FormData
): Promise<SubscriptionActionState> {
    const parsed =
        updateSubscriptionSchema.safeParse({
            subscriptionId:
                getFormString(
                    formData,
                    "subscriptionId"
                ),

            name: getFormString(
                formData,
                "name"
            ),

            provider: getFormString(
                formData,
                "provider"
            ),

            amount: getFormString(
                formData,
                "amount"
            ),

            currency: getFormString(
                formData,
                "currency"
            ),

            billingCycle: getFormString(
                formData,
                "billingCycle"
            ),

            startDate: getFormString(
                formData,
                "startDate"
            ),

            nextPaymentDate:
                getFormString(
                    formData,
                    "nextPaymentDate"
                ),

            durationType: getFormString(
                formData,
                "durationType"
            ),

            durationMonths:
                getFormString(
                    formData,
                    "durationMonths"
                ),

            totalPayments:
                getFormString(
                    formData,
                    "totalPayments"
                ),

            autoRenew: getFormString(
                formData,
                "autoRenew"
            ),

            accountId: getFormString(
                formData,
                "accountId"
            ),

            categoryId: getFormString(
                formData,
                "categoryId"
            ),

            notes: getFormString(
                formData,
                "notes"
            ),
        });

    if (!parsed.success) {
        console.error(
            "Update subscription validation error:",
            parsed.error.flatten()
        );

        return {
            success: false,
            message:
                "Please check the subscription details.",
            fieldErrors:
                parsed.error.flatten()
                    .fieldErrors,
        };
    }

    const supabase =
        await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            success: false,
            message:
                "You must be logged in to update a subscription.",
        };
    }

    const payload =
        getSubscriptionPayload(
            parsed.data
        );

    const { error } = await supabase
        .from("subscriptions")
        .update(payload)
        .eq(
            "id",
            parsed.data.subscriptionId
        )
        .eq("user_id", user.id);

    if (error) {
        console.error(
            "Update subscription error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return {
            success: false,
            message:
                "Could not update the subscription.",
        };
    }

    revalidatePath(
        "/subscriptions"
    );
    revalidatePath("/dashboard");

    redirect("/subscriptions");
}

export async function changeSubscriptionStatus(
    _previousState: SubscriptionActionState,
    formData: FormData
): Promise<SubscriptionActionState> {
    const parsed =
        changeSubscriptionStatusSchema.safeParse({
            subscriptionId:
                getFormString(
                    formData,
                    "subscriptionId"
                ),

            status: getFormString(
                formData,
                "status"
            ),
        });

    if (!parsed.success) {
        return {
            success: false,
            message:
                "Invalid subscription status.",
        };
    }

    const supabase =
        await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            message:
                "You must be logged in.",
        };
    }

    const { error } = await supabase
        .from("subscriptions")
        .update({
            status: parsed.data.status,
        })
        .eq(
            "id",
            parsed.data.subscriptionId
        )
        .eq("user_id", user.id);

    if (error) {
        console.error(
            "Change subscription status error:",
            error
        );

        return {
            success: false,
            message:
                "Could not update the subscription status.",
        };
    }

    revalidatePath(
        "/subscriptions"
    );
    revalidatePath("/dashboard");

    return {
        success: true,
        message:
            "Subscription status updated.",
    };
}

export async function deleteSubscription(
    _previousState: SubscriptionActionState,
    formData: FormData
): Promise<SubscriptionActionState> {
    const subscriptionId = getFormString(formData, "subscriptionId");
    if (!subscriptionId) return { success: false, message: "Invalid subscription." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "You must be logged in." };

    const { count, error: countError } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("subscription_id", subscriptionId)
        .eq("user_id", user.id);

    if (countError) return { success: false, message: "Could not check subscription history." };

    if ((count ?? 0) > 0) {
        const { error } = await supabase
            .from("subscriptions")
            .update({ status: "cancelled" })
            .eq("id", subscriptionId)
            .eq("user_id", user.id);
        if (error) return { success: false, message: "Could not archive the subscription." };
        revalidatePath("/subscriptions"); revalidatePath("/dashboard");
        return { success: true, message: "Subscription archived. Payment history was preserved." };
    }

    const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", subscriptionId)
        .eq("user_id", user.id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/subscriptions"); revalidatePath("/dashboard");
    return { success: true, message: "Unused subscription deleted." };
}

function revalidateSubscriptionRelatedPaths() {
    const paths = [
        "/subscriptions",
        "/transactions",
        "/accounts",
        "/dashboard",
        "/reports",
    ];

    for (const path of paths) {
        revalidatePath(path);
    }
}

export async function recordSubscriptionPayment(
    _previousState: SubscriptionActionState,
    formData: FormData
): Promise<SubscriptionActionState> {
    const parsed = subscriptionPaymentSchema.safeParse({
        subscriptionId: getFormString(formData, "subscriptionId"),
        accountId: getFormString(formData, "accountId"),
        amount: getFormString(formData, "amount"),
        paidAt: getFormString(formData, "paidAt"),
        notes: getFormString(formData, "notes"),
    });

    if (!parsed.success) {
        return {
            success: false,
            message: "Review the payment details.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("record_subscription_payment", {
        p_subscription_id: parsed.data.subscriptionId,
        p_account_id: parsed.data.accountId,
        p_amount: parsed.data.amount,
        p_paid_at: parsed.data.paidAt,
        p_notes: parsed.data.notes ?? "",
    });

    if (error) {
        return { success: false, message: error.message };
    }

    revalidateSubscriptionRelatedPaths();
    return { success: true, message: "Subscription payment recorded." };
}

export async function updateSubscriptionPayment(
    _previousState: SubscriptionActionState,
    formData: FormData
): Promise<SubscriptionActionState> {
    const parsed = updateSubscriptionPaymentSchema.safeParse({
        paymentId: getFormString(formData, "paymentId"),
        accountId: getFormString(formData, "accountId"),
        amount: getFormString(formData, "amount"),
        paidAt: getFormString(formData, "paidAt"),
        notes: getFormString(formData, "notes"),
    });

    if (!parsed.success) {
        return {
            success: false,
            message: "Review the payment details.",
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("update_subscription_payment", {
        p_payment_id: parsed.data.paymentId,
        p_account_id: parsed.data.accountId,
        p_amount: parsed.data.amount,
        p_paid_at: parsed.data.paidAt,
        p_notes: parsed.data.notes ?? "",
    });

    if (error) return { success: false, message: error.message };

    revalidateSubscriptionRelatedPaths();
    return { success: true, message: "Subscription payment updated." };
}

export async function deleteSubscriptionPayment(
    paymentId: string
): Promise<SubscriptionActionState> {
    const parsed = updateSubscriptionPaymentSchema.shape.paymentId.safeParse(paymentId);
    if (!parsed.success) return { success: false, message: "Invalid subscription payment." };

    const supabase = await createClient();
    const { error } = await supabase.rpc("delete_subscription_payment", {
        p_payment_id: parsed.data,
    });

    if (error) return { success: false, message: error.message };

    revalidateSubscriptionRelatedPaths();
    return { success: true, message: "Subscription payment deleted." };
}
