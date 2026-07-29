import { CalendarDays, CheckCircle2, Clock3, ReceiptText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Bill } from "@/features/bills/types/bill";
import type { AccountWithBalance } from "@/features/accounts/types/account";
import { EditBillDialog } from "@/features/bills/components/bill-dialogs";
import { DeleteBillButton } from "@/features/bills/components/delete-bill-button";

export function BillsList({ bills, accounts }: { bills: Bill[]; accounts: AccountWithBalance[] }) {
  if (!bills.length) {
    return <Card className="border-sky-500/20 bg-sky-500/5"><CardContent className="py-14 text-center"><ReceiptText className="mx-auto mb-3 size-8 text-sky-500" /><p className="font-medium">No fixed bills yet</p><p className="mt-1 text-sm text-muted-foreground">Add DEWA, du home internet, and both mobile lines once.</p></CardContent></Card>;
  }

  return <div className="grid gap-3 lg:grid-cols-2">{bills.map((bill) => {
    const paidThisMonth = bill.bill_payments.length > 0;
    const account = accounts.find((item) => item.id === bill.default_account_id);
    return <Card key={bill.id} className="border-sky-500/15 bg-gradient-to-br from-sky-500/8 via-card to-transparent"><CardContent className="flex items-center gap-4 p-5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500">{paidThisMonth ? <CheckCircle2 className="size-5" /> : <Clock3 className="size-5" />}</div>
      <div className="min-w-0 flex-1"><p className="font-semibold">{bill.name}</p><p className="mt-1 text-xs text-muted-foreground">{bill.provider ?? "Fixed bill"}{bill.due_day ? ` · due day ${bill.due_day}` : ""}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">{account ? <span>{account.name}</span> : null}{bill.expected_amount != null ? <span>Expected {Number(bill.expected_amount).toFixed(2)} {bill.currency}</span> : null}<span className="flex items-center gap-1"><CalendarDays className="size-3" />{bill.frequency}</span></div></div>
      <div className="flex shrink-0 items-center gap-1"><span className={paidThisMonth ? "mr-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600" : "mr-1 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600"}>{paidThisMonth ? "Paid this month" : "Pending"}</span><EditBillDialog bill={bill} accounts={accounts} /><DeleteBillButton billId={bill.id} billName={bill.name} /></div>
    </CardContent></Card>;
  })}</div>;
}
