import { HandCoins, Scale, UsersRound, WalletCards } from "lucide-react";

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
    },
    {
      label: "Owed to you",
      value: `${formatAmount(owedToYou)} ${currency}`,
      helper: "Money others should return",
      icon: HandCoins,
    },
    {
      label: "You owe",
      value: `${formatAmount(youOwe)} ${currency}`,
      helper: "Money you need to repay",
      icon: WalletCards,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="overflow-hidden">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.helper}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {people.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
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
    </div>
  );
}
