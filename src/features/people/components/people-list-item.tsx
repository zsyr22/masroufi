import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, HandCoins, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAbsoluteBalance, getBalanceStatus } from "../utils/balance";
import type { PersonBalance } from "../types/person";

type Props = {
  person: PersonBalance;
};

function formatDate(value: string | null) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function PeopleListItem({ person }: Props) {
  const balance = Number(person.current_balance);
  const status = getBalanceStatus(balance);
  const amount = getAbsoluteBalance(balance);

  const statusLabel =
    status === "owed_to_you"
      ? "Owes you"
      : status === "you_owe"
        ? "You owe"
        : "Settled";

  const StatusIcon =
    status === "owed_to_you"
      ? HandCoins
      : status === "you_owe"
        ? WalletCards
        : CheckCircle2;

  return (
    <Link href={`/people/${person.person_id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-primary/35 group-hover:bg-muted/20">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <StatusIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{person.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{statusLabel}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {person.entries_count} {person.entries_count === 1 ? "entry" : "entries"}
                  </span>
                </div>
              </div>
            </div>
            <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>

          <div className="mt-6 flex items-end justify-between gap-4 border-t pt-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Current balance
              </p>
              <p className="mt-1 text-xl font-semibold">
                {status === "settled"
                  ? "Settled"
                  : `${amount.toFixed(2)} ${person.currency ?? "AED"}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {formatDate(person.last_entry_date)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
