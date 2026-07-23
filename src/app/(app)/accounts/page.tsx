import { PageHeader } from "@/components/shared/page-header";
import { AccountCard } from "@/features/accounts/components/account-card";
import { AddAccountDialog } from "@/features/accounts/components/add-account-dialog";
import { AccountsEmptyState } from "@/features/accounts/components/accounts-empty-state";
import { AccountsSummary } from "@/features/accounts/components/accounts-summary";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { calculateAccountSummary } from "@/features/accounts/utils/account-summary";

export default async function AccountsPage() {
  const accounts = await getCurrentUserAccounts();
  const summary = calculateAccountSummary(accounts);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts, cash, and savings."
        action={
          accounts.length > 0 ? <AddAccountDialog /> : undefined
        }
      />

      {accounts.length === 0 ? (
        <AccountsEmptyState />
      ) : (
        <>
          <AccountsSummary summary={summary} />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Your accounts
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Active accounts and their current balances.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}