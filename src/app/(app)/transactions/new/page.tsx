import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { getCurrentUserActivePeople } from "@/features/people/services/people-service";
import { AddTransactionForm } from "@/features/transactions/components/add-transaction-form";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";

export default async function NewTransactionPage() {
  const [accounts, categories, people] = await Promise.all([getCurrentUserAccounts(), getCurrentUserCategories(), getCurrentUserActivePeople()]);
  if (accounts.length === 0) redirect("/accounts");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/transactions" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" />Back to transactions</Link>
      <section className="rounded-[26px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-transparent p-6 shadow-[0_20px_70px_rgba(16,185,129,0.07)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400"><Sparkles className="size-3.5" />Quick money entry</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Add transaction</h1>
        <p className="mt-2 text-sm text-muted-foreground">Record an expense or income and keep your balances accurate.</p>
      </section>
      <AddTransactionForm accounts={accounts} categories={categories} people={people} />
    </div>
  );
}
