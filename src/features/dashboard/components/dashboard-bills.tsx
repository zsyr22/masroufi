import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ReceiptText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardBillsData } from "@/features/bills/types/bill";

export function DashboardBills({ data }: { data: DashboardBillsData }) {
  const activeBills = data.activeBills;
  const paidActiveIds = new Set(
    activeBills
      .filter((bill) => bill.bill_payments.length > 0)
      .map((bill) => bill.id)
  );
  const pending = activeBills.filter((bill) => !paidActiveIds.has(bill.id));
  const paidRecords = data.paidPayments;
  const overdue = pending.filter((bill) => {
    if (!bill.due_day) return false;
    return bill.due_day < new Date().getDate();
  });

  return (
    <Card className="group relative overflow-hidden border-sky-500/15 bg-gradient-to-br from-sky-500/10 via-card to-transparent shadow-[0_28px_90px_-55px_rgba(14,165,233,0.8)]">
      <div className="pointer-events-none absolute -right-14 -top-16 size-44 rounded-full bg-sky-500/10 blur-3xl" />
      <CardHeader className="relative flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="size-4 text-sky-500" /> Monthly bills
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Current obligations and payments.
          </p>
        </div>
        <Link
          href="/bills"
          className="flex items-center gap-1 text-xs font-medium text-sky-500 transition hover:gap-2"
        >
          Open bills <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3">
            <Clock3 className="size-4 text-amber-500" />
            <p className="mt-2 text-xl font-semibold">{pending.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <p className="mt-2 text-xl font-semibold">{paidRecords.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Paid</p>
          </div>
          <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-3">
            <AlertCircle className="size-4 text-rose-500" />
            <p className="mt-2 text-xl font-semibold">{overdue.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        <div className="space-y-2">
          {activeBills.slice(0, 4).map((bill) => {
            const isPaid = paidActiveIds.has(bill.id);
            const isOverdue = !isPaid && bill.due_day && bill.due_day < new Date().getDate();

            return (
              <div
                key={bill.id}
                className="flex items-center justify-between rounded-2xl border bg-background/45 px-3 py-3 transition hover:bg-background/70"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                      isPaid
                        ? "bg-emerald-500/10 text-emerald-500"
                        : isOverdue
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="size-4" />
                    ) : isOverdue ? (
                      <AlertCircle className="size-4" />
                    ) : (
                      <Clock3 className="size-4" />
                    )}
                  </span>
                  <span className="truncate text-sm font-medium">{bill.name}</span>
                </div>
                <span
                  className={`text-xs ${
                    isOverdue ? "font-medium text-rose-500" : "text-muted-foreground"
                  }`}
                >
                  {isPaid ? "Paid" : bill.due_day ? `Due ${bill.due_day}` : "Pending"}
                </span>
              </div>
            );
          })}

          {activeBills.length === 0 && paidRecords.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
              Add your fixed bills to track them here.
            </p>
          ) : null}
          {activeBills.length === 0 && paidRecords.length > 0 ? (
            <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              No active fixed bills. Payment history is preserved.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
