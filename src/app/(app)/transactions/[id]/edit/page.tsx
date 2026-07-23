import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import {
    AddTransactionForm,
    type TransactionFormInitialValues,
} from "@/features/transactions/components/add-transaction-form";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";
import { getCurrentUserTransactionById } from "@/features/transactions/services/transaction-service";

type EditTransactionPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditTransactionPage({
    params,
}: EditTransactionPageProps) {
    const { id } = await params;

    const [transaction, accounts, categories] = await Promise.all([
        getCurrentUserTransactionById(id),
        getCurrentUserAccounts(),
        getCurrentUserCategories(),
    ]);

    if (!transaction) {
        notFound();
    }

    if (accounts.length === 0) {
        redirect("/accounts");
    }

    const payee = Array.isArray(transaction.payees)
        ? transaction.payees[0]
        : transaction.payees;

    const initialValues: TransactionFormInitialValues = {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        accountId: transaction.account_id,
        categoryId: transaction.category_id,
        payeeName: payee?.name ?? "",
        payeeType:
            payee?.type ??
            (transaction.type === "income"
                ? "company"
                : "store"),
        transactionDate: transaction.transaction_date,
        notes: transaction.notes ?? "",
    };
    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <PageHeader
                title="Edit transaction"
                description="Update the transaction details and keep your balances accurate."
            />

            <AddTransactionForm
                mode="edit"
                accounts={accounts}
                categories={categories}
                initialValues={initialValues}
            />
        </div>
    );
}