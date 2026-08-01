import { Landmark, Plus, Sparkles } from "lucide-react";

import { AccountCard } from "@/features/accounts/components/account-card";
import { AddAccountDialog } from "@/features/accounts/components/add-account-dialog";
import { AccountsEmptyState } from "@/features/accounts/components/accounts-empty-state";
import { AccountsSummary } from "@/features/accounts/components/accounts-summary";
import { ArchivedAccounts } from "@/features/accounts/components/archived-accounts";
import { getCurrentUserAccounts, getCurrentUserArchivedAccounts } from "@/features/accounts/services/account-service";
import { calculateAccountSummary } from "@/features/accounts/utils/account-summary";

export default async function AccountsPage() {
  const [accounts, archivedAccounts] = await Promise.all([getCurrentUserAccounts(), getCurrentUserArchivedAccounts()]);
  const summary = calculateAccountSummary(accounts);
  const hasAnyAccounts = accounts.length > 0 || archivedAccounts.length > 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-sky-500/20 bg-gradient-to-br from-sky-500/12 via-card to-violet-500/8 p-6 shadow-[0_24px_90px_rgba(14,165,233,0.08)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-400"><Sparkles className="size-3.5" />Account control</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Your money, across every account.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">See what is available, what is saved, and exactly where every balance comes from.</p>
          </div>
          {hasAnyAccounts ? <AddAccountDialog /> : null}
        </div>
      </section>

      {!hasAnyAccounts ? <AccountsEmptyState /> : (
        <>
          {accounts.length > 0 ? (
            <>
              <AccountsSummary summary={summary} />
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2"><Landmark className="size-5 text-sky-400" /><h2 className="text-xl font-semibold tracking-tight">Your accounts</h2></div>
                    <p className="mt-1 text-sm text-muted-foreground">{accounts.length} active account{accounts.length === 1 ? "" : "s"} with live balances.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{accounts.map((account) => <AccountCard key={account.id} account={account} />)}</div>
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 px-6 py-12 text-center">
              <p className="font-medium">No active accounts</p><p className="mt-1 text-sm text-muted-foreground">Restore an archived account or create a new one.</p><div className="mt-5 flex justify-center"><AddAccountDialog /></div>
            </div>
          )}
          <ArchivedAccounts accounts={archivedAccounts} />
        </>
      )}
    </div>
  );
}
