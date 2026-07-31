import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  HandCoins,
  RefreshCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PersonBalanceEntry, PersonEntryType } from "../types/person";

type Props = {
  entries: PersonBalanceEntry[];
};

const entryTypeLabels: Record<PersonEntryType, string> = {
  paid_for_person: "You paid for them",
  person_paid_for_me: "They paid for you",
  repayment_received: "Repayment received",
  repayment_sent: "Repayment sent",
  adjustment: "Balance adjustment",
};

const entryTypeIcons = {
  paid_for_person: HandCoins,
  person_paid_for_me: CircleDollarSign,
  repayment_received: ArrowDownLeft,
  repayment_sent: ArrowUpRight,
  adjustment: RefreshCcw,
} satisfies Record<PersonEntryType, typeof HandCoins>;

function formatEntryDate(date: string, createdAt: string) {
  const datePart = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));

  return `${datePart} · ${timePart}`;
}

export function PersonLedger({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-12 text-center">
        <p className="font-medium">No balance activity yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Expenses, repayments, and adjustments involving this person will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const increasesReceivable = entry.balance_effect > 0;
        const Icon = entryTypeIcons[entry.entry_type];

        return (
          <div
            key={entry.id}
            className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{entryTypeLabels[entry.entry_type]}</p>
                  <Badge variant="outline">
                    {increasesReceivable ? "Balance increased" : "Balance reduced"}
                  </Badge>
                </div>
                {entry.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatEntryDate(entry.entry_date, entry.created_at)}
                </p>
              </div>
            </div>

            <div className="shrink-0 sm:text-right">
              <p className="text-lg font-semibold">
                {increasesReceivable ? "+" : "−"}
                {Math.abs(entry.balance_effect).toFixed(2)} {entry.currency}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Effect on person balance
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
