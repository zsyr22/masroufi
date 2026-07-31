import { CalendarDays, ReceiptText, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BillPaymentHistoryItem } from "@/features/bills/types/bill";
import type { AccountWithBalance } from "@/features/accounts/types/account";
import { DeleteBillPaymentButton, EditBillPaymentDialog } from "@/features/bills/components/bill-payment-actions";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export function BillPaymentHistory({ payments, accounts }: { payments: BillPaymentHistoryItem[]; accounts: AccountWithBalance[] }) {
  return (
    <Card className="overflow-hidden border-sky-500/20 bg-gradient-to-br from-sky-500/7 via-card to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4 text-sky-500" />Paid bills history</CardTitle>
        <p className="text-sm text-muted-foreground">Every recorded payment also appears in Transactions and affects the selected account balance.</p>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <ReceiptText className="mx-auto size-8 text-sky-500" />
            <p className="mt-3 font-medium">No bill payments recorded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose a fixed bill above and enter the amount you paid.</p>
          </div>
        ) : (
          <div className="divide-y divide-sky-500/10">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-sky-500/5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500"><ReceiptText className="size-4" /></div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{payment.bill?.name ?? "Bill payment"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDate(payment.paid_at)}</span>
                      <span className="flex items-center gap-1"><WalletCards className="size-3" />{payment.transaction?.account?.name ?? "Account"}</span>
                      {payment.notes ? <span>{payment.notes}</span> : null}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <p className="mr-2 text-base font-semibold text-sky-600 dark:text-sky-400">{formatMoney(Number(payment.amount), payment.bill?.currency ?? "AED")}</p>
                  <EditBillPaymentDialog payment={payment} accounts={accounts} />
                  <DeleteBillPaymentButton payment={payment} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
