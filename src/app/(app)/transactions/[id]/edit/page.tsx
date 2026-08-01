import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { getCurrentUserActivePeople, getPersonEntryByTransactionId } from "@/features/people/services/people-service";
import { AddTransactionForm, type TransactionFormInitialValues } from "@/features/transactions/components/add-transaction-form";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";
import { getCurrentUserTransactionById, getTransactionSource } from "@/features/transactions/services/transaction-service";

type EditTransactionPageProps = { params: Promise<{ id: string }> };

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const { id } = await params;
  const [transaction, source, accounts, categories, people, personEntry] = await Promise.all([
    getCurrentUserTransactionById(id),
    getTransactionSource(id),
    getCurrentUserAccounts(),
    getCurrentUserCategories(),
    getCurrentUserActivePeople(),
    getPersonEntryByTransactionId(id),
  ]);

  if (!transaction) notFound();
  if (source) redirect(source.href);
  if (accounts.length === 0) redirect("/accounts");

  const payee = Array.isArray(transaction.payees) ? transaction.payees[0] : transaction.payees;
  const supportedRelationship = personEntry?.entry_type === "paid_for_person" || personEntry?.entry_type === "repayment_received" || personEntry?.entry_type === "repayment_sent" ? personEntry.entry_type : "";

  const initialValues: TransactionFormInitialValues = {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    accountId: transaction.account_id,
    categoryId: transaction.category_id,
    payeeName: payee?.name ?? "",
    payeeType: payee?.type ?? (transaction.type === "income" ? "company" : "store"),
    transactionDate: transaction.transaction_date,
    notes: transaction.notes ?? "",
    involvesPerson: Boolean(personEntry),
    personId: personEntry?.person_id ?? "",
    personRelationship: supportedRelationship,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/transactions" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" />Back to transactions</Link>
      <section className="rounded-[26px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-transparent p-6 shadow-[0_20px_70px_rgba(16,185,129,0.07)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400"><Sparkles className="size-3.5" />Transaction editor</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Edit transaction</h1>
        <p className="mt-2 text-sm text-muted-foreground">Update the details and keep every linked balance accurate.</p>
      </section>
      <AddTransactionForm mode="edit" accounts={accounts} categories={categories} people={people} initialValues={initialValues} />
    </div>
  );
}
