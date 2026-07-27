import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { getCurrentUserActivePeople } from "@/features/people/services/people-service";
import { AddTransactionForm } from "@/features/transactions/components/add-transaction-form";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";

export default async function NewTransactionPage() {
    const [accounts, categories, people] =
        await Promise.all([
            getCurrentUserAccounts(),
            getCurrentUserCategories(),
            getCurrentUserActivePeople(),
        ]);

    if (accounts.length === 0) {
        redirect("/accounts");
    }

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <PageHeader
                title="Add transaction"
                description="Record an expense or income and keep your account balances accurate."
            />

            <AddTransactionForm
                accounts={accounts}
                categories={categories}
                people={people}
            />
        </div>
    );
}