import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import type { PersonBalance } from "../types/person";
import { getAbsoluteBalance, getBalanceStatus } from "../utils/balance";

type Props = {
  people: PersonBalance[];
};

type CurrencySummary = {
  owedToYou: number;
  youOwe: number;
};

function getCurrencySummaries(people: PersonBalance[]) {
  return people.reduce<Record<string, CurrencySummary>>((result, person) => {
    if (!person.currency) return result;

    const balance = Number(person.current_balance);

    if (!result[person.currency]) {
      result[person.currency] = { owedToYou: 0, youOwe: 0 };
    }

    if (balance > 0) result[person.currency].owedToYou += balance;
    if (balance < 0) result[person.currency].youOwe += Math.abs(balance);

    return result;
  }, {});
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardPeopleBalances({ people }: Props) {
  const activeBalances = people
    .filter((person) => Number(person.current_balance) !== 0)
    .slice(0, 5);
  const summaryEntries = Object.entries(getCurrencySummaries(people));

  return (
    <section className="group relative h-full overflow-hidden rounded-2xl border border-rose-500/15 bg-gradient-to-br from-rose-500/9 via-card to-transparent text-card-foreground shadow-[0_28px_90px_-55px_rgba(244,63,94,0.75)]">
      <div className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-rose-500/9 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-rose-500" />
            <h2 className="font-semibold">People balances</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Money you owe or are owed.
          </p>
        </div>
        <Link
          href="/people"
          className="flex items-center gap-1 text-xs font-medium text-rose-500 transition hover:gap-2"
        >
          View all <ArrowRight className="size-3" />
        </Link>
      </div>

      {summaryEntries.length > 0 ? (
        <div className="relative grid gap-3 px-6 pb-5 sm:grid-cols-2">
          {summaryEntries.slice(0, 2).map(([currency, summary]) => (
            <div
              key={currency}
              className="grid grid-cols-2 gap-3 rounded-2xl border border-rose-500/10 bg-background/45 p-4"
            >
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <TrendingUp className="size-3.5 text-emerald-500" /> Owed to you
                </div>
                <p className="mt-2 text-sm font-semibold text-emerald-500">
                  {summary.owedToYou.toFixed(2)} {currency}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <TrendingDown className="size-3.5 text-rose-500" /> You owe
                </div>
                <p className="mt-2 text-sm font-semibold text-rose-500">
                  {summary.youOwe.toFixed(2)} {currency}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeBalances.length === 0 ? (
        <div className="relative flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/15">
            <CheckCircle2 className="size-5 text-emerald-500" />
          </div>
          <p className="mt-3 font-medium">All balances are settled</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No one currently owes you money, and you do not owe anyone.
          </p>
        </div>
      ) : (
        <div className="relative space-y-1 px-3 pb-3">
          {activeBalances.map((person) => {
            const balance = Number(person.current_balance);
            const status = getBalanceStatus(balance);
            const owedToYou = status === "owed_to_you";

            return (
              <Link
                key={`${person.person_id}-${person.currency}`}
                href={`/people/${person.person_id}`}
                className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 transition hover:bg-background/55"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-xs font-semibold text-rose-500 ring-1 ring-rose-500/15">
                    {getInitials(person.name) || <UserRound className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{person.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {owedToYou ? "Owes you" : "You owe"}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-semibold ${
                      owedToYou ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {getAbsoluteBalance(balance).toFixed(2)} {person.currency}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {owedToYou ? "Receivable" : "Payable"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
