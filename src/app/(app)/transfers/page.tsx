import Link from "next/link";
import { ArrowRight, ArrowRightLeft, Pencil, Plus, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteTransferButton } from "@/features/transfers/components/delete-transfer-button";
import { getCurrentUserTransfers } from "@/features/transfers/services/transfer-service";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export default async function TransfersPage() {
  const transfers = await getCurrentUserTransfers();
  const totalMoved = transfers.reduce((sum, transfer) => sum + Number(transfer.amount), 0);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/12 via-card to-blue-500/8 p-6 shadow-[0_24px_90px_rgba(6,182,212,0.08)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400"><Sparkles className="size-3.5" />Account movement</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Move money without changing your spending.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Transfers keep both account balances accurate while staying outside income and expense totals.</p>
          </div>
          <Link href="/transfers/new" className={cn(buttonVariants(), "gap-2 shadow-lg shadow-cyan-500/10")}><Plus className="size-4" />New transfer</Link>
        </div>
      </section>

      {transfers.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card to-card"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Transfers recorded</p><p className="mt-3 text-3xl font-semibold">{transfers.length}</p><p className="mt-1 text-sm text-muted-foreground">Complete account movements</p></CardContent></Card>
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card to-card"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total money moved</p><p className="mt-3 text-3xl font-semibold">{formatCurrency(totalMoved, transfers[0]?.currency ?? "AED")}</p><p className="mt-1 text-sm text-muted-foreground">Movement, not spending</p></CardContent></Card>
        </section>
      ) : null}

      {transfers.length === 0 ? (
        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 via-card to-transparent">
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400"><ArrowRightLeft className="size-6" /></div>
            <h2 className="mt-5 text-lg font-semibold">No transfers yet</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Move money between accounts without counting it as income or spending.</p>
            <Link href="/transfers/new" className={cn(buttonVariants(), "mt-5")}><Plus className="size-4" />Create transfer</Link>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-4">
          <div><h2 className="text-xl font-semibold tracking-tight">Transfer history</h2><p className="mt-1 text-sm text-muted-foreground">A clean record of money moved between your accounts.</p></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {transfers.map((transfer) => (
              <Card key={transfer.id} className="group border-cyan-500/15 bg-gradient-to-br from-cyan-500/7 via-card to-transparent transition duration-300 hover:-translate-y-1 hover:border-cyan-400/35 hover:shadow-[0_20px_70px_rgba(6,182,212,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400"><ArrowRightLeft className="size-5" /></div>
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 font-medium"><span>{transfer.from_account?.name ?? "Unknown account"}</span><ArrowRight className="size-4 text-cyan-400" /><span>{transfer.to_account?.name ?? "Unknown account"}</span></div><p className="mt-1 text-xs text-muted-foreground">{formatDate(transfer.transfer_date)}{transfer.notes ? ` · ${transfer.notes}` : ""}</p></div>
                    </div>
                    <p className="shrink-0 text-lg font-semibold">{formatCurrency(Number(transfer.amount), transfer.currency)}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/5 pt-4">
                    <Link href={`/transfers/${transfer.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Pencil className="size-4" />Edit</Link>
                    <DeleteTransferButton transferId={transfer.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
