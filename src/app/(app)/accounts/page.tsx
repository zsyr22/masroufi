import { PageHeader } from "@/components/shared/page-header";

import { AccountCard } from "@/features/accounts/components/account-card";
import { AddAccountDialog } from "@/features/accounts/components/add-account-dialog";
import { AccountsEmptyState } from "@/features/accounts/components/accounts-empty-state";
import { AccountsSummary } from "@/features/accounts/components/accounts-summary";
import { ArchivedAccounts } from "@/features/accounts/components/archived-accounts";

import {
  getCurrentUserAccounts,
  getCurrentUserArchivedAccounts,
} from "@/features/accounts/services/account-service";

import { calculateAccountSummary } from "@/features/accounts/utils/account-summary";

export default async function AccountsPage() {
  const [accounts, archivedAccounts] =
    await Promise.all([
      getCurrentUserAccounts(),
      getCurrentUserArchivedAccounts(),
    ]);

  const summary =
    calculateAccountSummary(accounts);

  const hasAnyAccounts =
    accounts.length > 0 ||
    archivedAccounts.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts, cash, and savings."
        action={
          hasAnyAccounts ? (
            <AddAccountDialog />
          ) : undefined
        }
      />

      {!hasAnyAccounts ? (
        <AccountsEmptyState />
      ) : (
        <>
          {accounts.length > 0 ? (
            <>
              <AccountsSummary
                summary={summary}
              />

              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Your accounts
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Active accounts
                    and their current
                    balances.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {accounts.map(
                    (account) => (
                      <AccountCard
                        key={
                          account.id
                        }
                        account={
                          account
                        }
                      />
                    )
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-xl border px-6 py-10 text-center">
              <p className="font-medium">
                No active accounts
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Restore an archived
                account or create a new
                one.
              </p>

              <div className="mt-5 flex justify-center">
                <AddAccountDialog />
              </div>
            </div>
          )}

          <ArchivedAccounts
            accounts={
              archivedAccounts
            }
          />
        </>
      )}
    </div>
  );
}