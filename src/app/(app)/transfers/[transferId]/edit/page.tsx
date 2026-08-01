import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { TransferForm, type TransferFormInitialValues } from "@/features/transfers/components/transfer-form";
import { getCurrentUserTransferById } from "@/features/transfers/services/transfer-service";

type EditTransferPageProps = { params: Promise<{ transferId: string }> };

export default async function EditTransferPage({ params }: EditTransferPageProps) {
  const { transferId } = await params;
  const [transfer, accounts] = await Promise.all([getCurrentUserTransferById(transferId), getCurrentUserAccounts()]);
  if (!transfer) notFound();
  if (accounts.length < 2) redirect("/accounts");

  const initialValues: TransferFormInitialValues = {
    id: transfer.id,
    fromAccountId: transfer.from_account_id,
    toAccountId: transfer.to_account_id,
    amount: Number(transfer.amount),
    transferDate: transfer.transfer_date,
    notes: transfer.notes ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/transfers" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" />Back to transfers</Link>
      <section className="rounded-[26px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card to-transparent p-6 shadow-[0_20px_70px_rgba(6,182,212,0.07)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400"><Sparkles className="size-3.5" />Transfer editor</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Edit transfer</h1>
        <p className="mt-2 text-sm text-muted-foreground">Update the transfer and recalculate both account balances.</p>
      </section>
      <TransferForm mode="edit" accounts={accounts} initialValues={initialValues} />
    </div>
  );
}
