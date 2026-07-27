import { SubscriptionForm } from "@/features/subscriptions/components/subscription-form";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";

export default async function NewSubscriptionPage() {
    const [accounts, categories] =
        await Promise.all([
            getCurrentUserAccounts(),
            getCurrentUserCategories(),
        ]);

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <p className="text-sm font-medium text-primary">
                    Recurring payment
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                    Add subscription
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    Add the payment details and choose
                    when the next payment is due.
                </p>
            </div>

            <SubscriptionForm
                accounts={accounts}
                categories={categories}
            />
        </div>
    );
}