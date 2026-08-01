import { HandCoins, Scale, Sparkles, UsersRound, WalletCards } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { PersonBalance } from "../types/person";
import { PeopleListItem } from "./people-list-item";

type Props = {
  people: PersonBalance[];
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PeopleList({ people }: Props) {
  const owedToYou = people.reduce(
    (total, person) => total + Math.max(Number(person.current_balance), 0),
    0
  );
  const youOwe = people.reduce(
    (total, person) => total + Math.max(-Number(person.current_balance), 0),
    0
  );
  const currency = people[0]?.currency ?? "AED";

  const summary = [
    {
      label: "People tracked",
      value: String(people.length),
      helper: "Active personal balances",
      icon: UsersRound,
      card: "border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/12 via-card to-card shadow-[0_18px_55px_rgba(217,70,239,0.08)]",
      iconClass: "bg-fuchsia-500/15 text-fuchsia-400",
    },
    {
      label: "Owed to you",
      value: `${formatAmount(owedToYou)} ${currency}`,
      helper: "Money others should return",
      icon: HandCoins,
      card: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-card to-card shadow-[0_18px_55px_rgba(16,185,129,0.08)]",
      iconClass: "bg-emerald-500/15 text-emerald-400",
    },
    {
      label: "You owe",
      value: `${formatAmount(youOwe)} ${currency}`,
      helper: "Money you need to repay",
      icon: WalletCards,
      card: "border-rose-500/20 bg-gradient-to-br from-rose-500/12 via-card to-card shadow-[0_18px_55px_rgba(244,63,94,0.08)]",
      iconClass: "bg-rose-500/15 text-rose-400",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              className={`${item.card} overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
            >
              <CardContent className="flex items-start justify-between gap-4 p-5 sm:p-6">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.helper}
                  </p>
                </div>
                <div className={`flex size-11 items-center justify-center rounded-2xl ${item.iconClass}`}>
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-fuchsia-400" />
              <h2 className="text-xl font-semibold tracking-tight">People ledger</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a person to review, correct, or record balance activity.
            </p>
          </div>
          <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-300">
            {people.length} {people.length === 1 ? "person" : "people"}
          </span>
        </div>

        {people.length === 0 ? (
          <Card className="border-dashed border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/6 via-card to-card">
            <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-400">
                <Scale className="size-6" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">No people yet</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Add someone when you pay on their behalf, borrow money, or need to track repayments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {people.map((person) => (
              <PeopleListItem key={person.person_id} person={person} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
