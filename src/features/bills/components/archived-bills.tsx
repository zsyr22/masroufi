"use client";

import { ArchiveRestore, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { restoreBill } from "@/features/bills/actions/bill-actions";
import type { Bill } from "@/features/bills/types/bill";

export function ArchivedBills({ bills }: { bills: Bill[] }) {
  const [selected, setSelected] = useState<Bill | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!bills.length) return null;

  function handleRestore() {
    if (!selected) return;
    setMessage(null);
    startTransition(async () => {
      const result = await restoreBill(selected.id);
      if (!result.success) { setMessage(result.message ?? "The bill could not be restored."); return; }
      setSelected(null);
    });
  }

  return <section className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Archived bills</h2>
      <p className="mt-1 text-sm text-muted-foreground">Hidden from new payments while all previous payment history stays available.</p>
    </div>
    <Card className="overflow-hidden border-border/70">
      <CardContent className="divide-y p-0">{bills.map((bill) => <div key={bill.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium">{bill.name}</p>
            <Badge variant="outline">Archived</Badge>{bill.bill_payments.length > 0 ? <Badge variant="secondary">Has payment history</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{bill.provider ?? "Fixed bill"}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { setMessage(null); setSelected(bill); }}>
          <ArchiveRestore className="size-4" />Restore</Button>
      </div>
      )}
      </CardContent>
    </Card>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open && !pending) { setSelected(null); setMessage(null); } }}><DialogContent><DialogHeader><DialogTitle>Restore bill?</DialogTitle><DialogDescription>{selected?.name} will appear again and can be selected for new monthly payments.</DialogDescription></DialogHeader>{message ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setSelected(null)}>Cancel</Button><Button type="button" disabled={pending} onClick={handleRestore}>{pending ? <><Loader2 className="size-4 animate-spin" />Restoring...</> : <><ArchiveRestore className="size-4" />Restore bill</>}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
