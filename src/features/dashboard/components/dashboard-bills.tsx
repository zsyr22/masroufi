import Link from "next/link";
import { CheckCircle2, Clock3, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Bill } from "@/features/bills/types/bill";

export function DashboardBills({ bills }: { bills: Bill[] }) {
  const paid = bills.filter((bill) => bill.bill_payments.length > 0);
  const pending = bills.filter((bill) => bill.bill_payments.length === 0);

  return (
    <Card className="border-sky-500/15 bg-gradient-to-br from-sky-500/7 via-card to-transparent">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><ReceiptText className="size-4 text-sky-500" /> Monthly bills</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Your fixed obligations for this month.</p>
        </div>
        <Link href="/bills" className="text-xs font-medium text-sky-500 hover:underline">Open bills</Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="mt-2 text-2xl font-semibold">{pending.length}</p></div>
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4"><p className="text-xs text-muted-foreground">Paid</p><p className="mt-2 text-2xl font-semibold">{paid.length}</p></div>
        </div>
        <div className="space-y-2">
          {bills.slice(0, 5).map((bill) => {
            const isPaid = bill.bill_payments.length > 0;
            return <div key={bill.id} className="flex items-center justify-between rounded-xl border bg-background/55 px-3 py-2.5"><div className="flex min-w-0 items-center gap-2.5">{isPaid ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" /> : <Clock3 className="size-4 shrink-0 text-amber-500" />}<span className="truncate text-sm font-medium">{bill.name}</span></div><span className="text-xs text-muted-foreground">{isPaid ? "Paid" : bill.due_day ? `Due ${bill.due_day}` : "Pending"}</span></div>;
          })}
          {bills.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Add your fixed bills to track them here.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
