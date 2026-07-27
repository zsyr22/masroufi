import { notFound } from "next/navigation";

import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { SubscriptionForm } from "@/features/subscriptions/components/subscription-form";
import { getCurrentUserSubscriptionById } from "@/features/subscriptions/services/subscription-service";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";

type EditSubscriptionPageProps = {
    params: Promise<{
        subscriptionId: string;
    }>;
};

export default async function EditSubscriptionPage({
    params,
}: EditSubscriptionPageProps) {
    const { subscriptionId } = await params;

    const [
        subscription,
        accounts,
        categories,
    ] = await Promise.all([
        getCurrentUserSubscriptionById(
            subscriptionId
        ),
        getCurrentUserAccounts(),
        getCurrentUserCategories(),
    ]);

    if (!subscription) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <p className="text-sm font-medium text-primary">
                    Recurring payment
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                    Edit subscription
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    Update the subscription details or
                    its next payment date.
                </p>
            </div>

            <SubscriptionForm
                mode="edit"
                accounts={accounts}
                categories={categories}
                initialValues={{
                    id: subscription.id,
                    name: subscription.name,

                    provider:
                        subscription.provider ?? "",

                    amount: Number(
                        subscription.amount
                    ),

                    currency:
                        subscription.currency,

                    billingCycle:
                        subscription.billing_cycle,

                    startDate:
                        subscription.start_date,

                    nextPaymentDate:
                        subscription.next_payment_date ??
                        subscription.start_date,

                    durationType:
                        subscription.duration_type,

                    durationMonths:
                        subscription.duration_months,

                    totalPayments:
                        subscription.total_payments,

                    autoRenew:
                        subscription.auto_renew,

                    accountId:
                        subscription.account_id ?? "",

                    categoryId:
                        subscription.category_id ?? "",

                    notes:
                        subscription.notes ?? "",
                }}
            />
        </div>
    );
}