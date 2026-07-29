import Link from "next/link";
import {
  Plus,
  ReceiptText,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { TransactionFilterSummary } from "@/features/transactions/components/transaction-filter-summary";
import { TransactionFilters } from "@/features/transactions/components/transaction-filters";
import { getCurrentUserTransactions } from "@/features/transactions/services/transaction-service";
import type { TransactionType } from "@/features/transactions/types/transaction";
import { cn } from "@/lib/utils";
import { TransactionHistory } from "@/features/transactions/components/transaction-history";
import { TransactionSearch } from "@/features/transactions/components/transaction-search";


type TransactionsPageProps = {
  searchParams: Promise<{
    q?: string;
    date?: string;
    type?: string;
    account?: string;
    page?: string;
  }>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;

  const searchQuery =
    params.q?.trim() ?? "";

  const parsedPage = Number.parseInt(
    params.page ?? "1",
    10
  );

  const requestedPage =
    Number.isFinite(parsedPage) &&
      parsedPage > 0
      ? parsedPage
      : 1;

  const date = params.date ?? "";

  const type: TransactionType | "all" =
    params.type === "income" ||
      params.type === "expense"
      ? params.type
      : "all";

  const accountId = params.account ?? "";

  const [
    transactionResult,
    accounts,
  ] = await Promise.all([
    getCurrentUserTransactions({
      search:
        searchQuery || undefined,
      date: date || undefined,
      type,
      accountId:
        accountId || undefined,
      page: requestedPage,
      pageSize: 25,
    }),
    getCurrentUserAccounts(),
  ]);

  const {
    transactions,
    totalCount,
    page,
    pageSize,
    totalPages,
  } = transactionResult;

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(date) ||
    type !== "all" ||
    Boolean(accountId);


  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Review your income, expenses, stores, and payment history."
        action={
          <Link
            href="/transactions/new"
            className={cn(
              buttonVariants(),
              "gap-2"
            )}
          >
            <Plus className="size-4" />
            Add transaction
          </Link>
        }
      />

      <TransactionSearch
        initialQuery={searchQuery}
      />

      <TransactionFilters
        accounts={accounts}
        date={date}
        type={type}
        accountId={accountId}
      />

      <TransactionFilterSummary transactions={transactions} />

      {transactions.length === 0 ? (
        <Card className="border-dashed border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
              <ReceiptText className="size-6" />
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              {hasActiveFilters
                ? "No matching transactions"
                : "No transactions yet"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {hasActiveFilters
                ? "Try changing or clearing the selected filters."
                : "Add your first expense or income to begin tracking where your money goes."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <TransactionHistory
          transactions={transactions}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}