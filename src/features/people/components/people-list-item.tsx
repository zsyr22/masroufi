import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  HandCoins,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DeletePersonButton } from "./delete-person-button";
import { EditPersonDialog } from "./edit-person-dialog";
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

  const theme =
    status === "owed_to_you"
      ? {
          card: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card hover:border-emerald-500/35",
          icon: "bg-emerald-500/15 text-emerald-400",
          badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
          amount: "text-emerald-300",
        }
      : status === "you_owe"
        ? {
            card: "border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card to-card hover:border-rose-500/35",
            icon: "bg-rose-500/15 text-rose-400",
            badge: "border-rose-500/25 bg-rose-500/10 text-rose-300",
            amount: "text-rose-300",
          }
        : {
            card: "border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/8 via-card to-card hover:border-fuchsia-500/35",
            icon: "bg-fuchsia-500/15 text-fuchsia-400",
            badge: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300",
            amount: "text-foreground",
          };

  return (
    <Card className={`${theme.card} group h-full overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-xl`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/people/${person.person_id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${theme.icon}`}>
              <StatusIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{person.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={theme.badge}>{statusLabel}</Badge>
                <span className="text-xs text-muted-foreground">
                  {person.entries_count} {person.entries_count === 1 ? "entry" : "entries"}
                </span>
              </div>
            </div>
          </Link>

          <Link
            href={`/people/${person.person_id}`}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            aria-label={`Open ${person.name}`}
          >
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Current balance
            </p>
            <p className={`mt-1 text-xl font-semibold ${theme.amount}`}>
              {status === "settled"
                ? "Settled"
                : `${amount.toFixed(2)} ${person.currency ?? "AED"}`}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {formatDate(person.last_entry_date)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <EditPersonDialog
              size="sm"
              person={{
                id: person.person_id,
                name: person.name,
                phone: person.phone,
                notes: person.notes,
              }}
            />
            <DeletePersonButton personId={person.person_id} personName={person.name} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
