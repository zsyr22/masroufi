import Link from "next/link";
import { Plus, ReceiptText, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { TransactionFilterSummary } from "@/features/transactions/components/transaction-filter-summary";
import { TransactionFilters } from "@/features/transactions/components/transaction-filters";
import { TransactionHistory } from "@/features/transactions/components/transaction-history";
import { TransactionSearch } from "@/features/transactions/components/transaction-search";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import type { TransactionType } from "@/features/transactions/types/transaction";
import { cn } from "@/lib/utils";

type TransactionsPageProps = { searchParams: Promise<{ q?: string; date?: string; type?: string; account?: string; page?: string }> };

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() ?? "";
  const parsedPage = Number(params.page ?? "1");
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const date = params.date ?? "";
  const type: TransactionType | "all" = params.type === "income" || params.type === "expense" ? params.type : "all";
  const accountId = params.account ?? "";
  const [transactionResult, accounts] = await Promise.all([
    getCurrentUserTransactions({ search: searchQuery || undefined, date: date || undefined, type, accountId: accountId || undefined, page: requestedPage, pageSize: 25 }),
    getCurrentUserAccounts(),
  ]);
  const { transactions, totalCount, page, pageSize, totalPages } = transactionResult;
  const hasActiveFilters = Boolean(searchQuery) || Boolean(date) || type !== "all" || Boolean(accountId);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-card to-cyan-500/8 p-6 shadow-[0_24px_90px_rgba(16,185,129,0.08)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400"><Sparkles className="size-3.5" />Money timeline</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Every dirham, clearly explained.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Search, filter, and manage every expense or income from one calm financial timeline.</p>
          </div>
          <Link href="/transactions/new" className={cn(buttonVariants(), "gap-2 shadow-lg shadow-emerald-500/10")}><Plus className="size-4" />Add transaction</Link>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/6 via-card to-transparent p-4 shadow-[0_18px_60px_rgba(16,185,129,0.05)] sm:p-5">
        <div className="space-y-4"><TransactionSearch initialQuery={searchQuery} /><TransactionFilters accounts={accounts} date={date} type={type} accountId={accountId} /></div>
      </section>

      <TransactionFilterSummary transactions={transactions} />

      {transactions.length === 0 ? (
        <Card className="border-dashed border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 via-card to-transparent">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400"><ReceiptText className="size-6" /></div>
            <h2 className="mt-5 text-lg font-semibold">{hasActiveFilters ? "No matching transactions" : "No transactions yet"}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{hasActiveFilters ? "Try changing or clearing the selected filters." : "Add your first expense or income to begin tracking where your money goes."}</p>
          </CardContent>
        </Card>
      ) : <TransactionHistory transactions={transactions} page={page} pageSize={pageSize} totalCount={totalCount} totalPages={totalPages} />}
    </div>
  );
}
