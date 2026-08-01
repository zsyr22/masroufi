import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { getCurrentUserCategories } from "@/features/transactions/services/category-service";
import { getArchivedBills, getBills, getBillPaymentHistory } from "@/features/bills/services/bill-service";
import { AddBillDialog, RecordBillPaymentDialog } from "@/features/bills/components/bill-dialogs";
import { BillsList } from "@/features/bills/components/bills-list";
import { BillPaymentHistory } from "@/features/bills/components/bill-payment-history";
import { ArchivedBills } from "@/features/bills/components/archived-bills";
import { ReceiptText, Sparkles } from "lucide-react";

export default async function BillsPage() {
  const [bills, archivedBills, payments, accounts, categories] = await Promise.all([
    getBills(),
    getArchivedBills(),
    getBillPaymentHistory(),
    getCurrentUserAccounts(),
    getCurrentUserCategories(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bills"
        description="Choose a fixed bill, enter what you actually paid, and let Masroufi handle the transaction and balance automatically."
        action={<AddBillDialog accounts={accounts} categories={categories} />}
      />

      <Card className="overflow-hidden border-sky-500/18 bg-gradient-to-br from-sky-500/9 via-card to-violet-500/4">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-500"><ReceiptText className="size-5" /></div>
            <div>
              <div className="flex items-center gap-2"><h2 className="text-lg font-semibold">Pay a monthly bill</h2><Sparkles className="size-4 text-sky-500" /></div>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">Example: choose DEWA, enter 685 AED, select the account, and save. It will appear below and inside Transactions automatically.</p>
            </div>
          </div>
          <RecordBillPaymentDialog bills={bills} accounts={accounts} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your fixed bills</h2>
          <p className="mt-1 text-sm text-muted-foreground">These are reusable bill entities, not individual monthly payments.</p>
        </div>
        <BillsList bills={bills} accounts={accounts} />
      </section>

      <ArchivedBills bills={archivedBills} />

      <BillPaymentHistory payments={payments} accounts={accounts} />
    </div>
  );
}
