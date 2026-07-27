"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
    changeSubscriptionStatusSchema,
    createSubscriptionSchema,
    deleteSubscriptionSchema,
    recordSubscriptionPaymentSchema,
    updateSubscriptionSchema,
} from "@/features/subscriptions/schemas/subscription-schema";
import type {
    SubscriptionBillingCycle,
    SubscriptionDurationType,
} from "@/features/subscriptions/types/subscription";
import {
    calculateContractEndDate,
    getNextSubscriptionPaymentDate,
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
    const parsed =
        deleteSubscriptionSchema.safeParse({
            subscriptionId:
                getFormString(
                    formData,
                    "subscriptionId"
                ),
        });

    if (!parsed.success) {
        return {
            success: false,
            message:
                "Invalid subscription.",
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
        .delete()
        .eq(
            "id",
            parsed.data.subscriptionId
        )
        .eq("user_id", user.id);

    if (error) {
        console.error(
            "Delete subscription error:",
            error
        );

        return {
            success: false,
            message:
                "Could not delete the subscription.",
        };
    }

    revalidatePath(
        "/subscriptions"
    );
    revalidatePath("/dashboard");

    return {
        success: true,
        message:
            "Subscription deleted.",
    };
}

export async function recordSubscriptionPayment(
    _previousState: SubscriptionActionState,
    formData: FormData
): Promise<SubscriptionActionState> {
    const parsed =
        recordSubscriptionPaymentSchema.safeParse({
            subscriptionId:
                getFormString(
                    formData,
                    "subscriptionId"
                ),

            paymentDate: getFormString(
                formData,
                "paymentDate"
            ),
        });

    if (!parsed.success) {
        return {
            success: false,
            message:
                "Invalid payment information.",
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

    const {
        data: subscription,
        error: loadError,
    } = await supabase
        .from("subscriptions")
        .select(`
            id,
            name,
            provider,
            amount,
            currency,
            billing_cycle,
            duration_type,
            duration_months,
            end_date,
            total_payments,
            payments_made,
            auto_renew,
            account_id,
            category_id,
            status
        `)
        .eq(
            "id",
            parsed.data.subscriptionId
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (
        loadError ||
        !subscription
    ) {
        console.error(
            "Load subscription payment error:",
            loadError
        );

        return {
            success: false,
            message:
                "Subscription not found.",
        };
    }

    if (
        subscription.status !==
        "active"
    ) {
        return {
            success: false,
            message:
                "Only active subscriptions can be paid.",
        };
    }

    if (!subscription.account_id) {
        return {
            success: false,
            message:
                "Select an account before recording this payment.",
        };
    }

    if (
        !subscription.category_id
    ) {
        return {
            success: false,
            message:
                "Select a category before recording this payment.",
        };
    }

    const transactionNotes = [
        `Subscription payment: ${subscription.name}`,
        subscription.provider
            ? `Provider: ${subscription.provider}`
            : null,
    ]
        .filter(Boolean)
        .join(" · ");

    const { error: transactionError } =
        await supabase
            .from("transactions")
            .insert({
                user_id: user.id,
                account_id:
                    subscription.account_id,

                category_id:
                    subscription.category_id,

                payee_id: null,
                type: "expense",

                amount: Number(
                    subscription.amount
                ),

                currency:
                    subscription.currency,

                transaction_date:
                    parsed.data.paymentDate,

                notes: transactionNotes,
            });

    if (transactionError) {
        console.error(
            "Create subscription transaction error:",
            {
                message:
                    transactionError.message,
                details:
                    transactionError.details,
                hint:
                    transactionError.hint,
                code:
                    transactionError.code,
            }
        );

        return {
            success: false,
            message:
                "Could not create the payment transaction.",
        };
    }

    const billingCycle =
        subscription.billing_cycle as SubscriptionBillingCycle;

    const durationType =
        subscription.duration_type as SubscriptionDurationType;

    const paymentsMade =
        Number(
            subscription.payments_made
        ) + 1;

    let nextPaymentDate =
        getNextSubscriptionPaymentDate(
            parsed.data.paymentDate,
            billingCycle
        );

    let nextStatus:
        | "active"
        | "completed" = "active";

    let nextEndDate =
        subscription.end_date;

    let nextPaymentsMade =
        paymentsMade;

    const reachedPaymentCount =
        durationType ===
        "payment_count" &&
        subscription.total_payments !==
        null &&
        paymentsMade >=
        Number(
            subscription.total_payments
        );

    const passedContractEnd =
        durationType ===
        "fixed_period" &&
        subscription.end_date !== null &&
        nextPaymentDate !== null &&
        nextPaymentDate >
        subscription.end_date;

    const isOneTime =
        billingCycle === "one_time";

    const contractFinished =
        isOneTime ||
        reachedPaymentCount ||
        passedContractEnd;

    if (contractFinished) {
        if (
            subscription.auto_renew &&
            durationType ===
            "fixed_period" &&
            subscription.duration_months
        ) {
            const renewalStart =
                nextPaymentDate ??
                parsed.data.paymentDate;

            nextEndDate =
                calculateContractEndDate(
                    renewalStart,
                    Number(
                        subscription.duration_months
                    )
                );

            nextPaymentsMade = 0;
            nextStatus = "active";
        } else if (
            subscription.auto_renew &&
            durationType ===
            "payment_count"
        ) {
            nextPaymentsMade = 0;
            nextStatus = "active";
        } else {
            nextPaymentDate = null;
            nextStatus = "completed";
        }
    }

    const { error: updateError } =
        await supabase
            .from("subscriptions")
            .update({
                last_paid_at:
                    parsed.data.paymentDate,

                next_payment_date:
                    nextPaymentDate,

                payments_made:
                    nextPaymentsMade,

                end_date: nextEndDate,

                status: nextStatus,
            })
            .eq(
                "id",
                subscription.id
            )
            .eq("user_id", user.id);

    if (updateError) {
        console.error(
            "Update subscription after payment error:",
            updateError
        );

        return {
            success: false,
            message:
                "Payment was recorded, but the subscription could not be updated.",
        };
    }

    revalidatePath(
        "/subscriptions"
    );
    revalidatePath(
        "/transactions"
    );
    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return {
        success: true,
        message:
            nextStatus === "completed"
                ? "Final payment recorded. Subscription completed."
                : "Payment recorded and next payment scheduled.",
    };
}