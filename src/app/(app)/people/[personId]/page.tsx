import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleUserRound,
  HandCoins,
  NotebookText,
  Phone,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddPersonEntryDialog } from "@/features/people/components/add-person-entry-dialog";
import { PersonLedger } from "@/features/people/components/person-ledger";
import {
  getCurrentUserPersonById,
  getPersonLedger,
} from "@/features/people/services/people-service";

type Props = {
  params: Promise<{ personId: string }>;
};

export default async function PersonDetailsPage({ params }: Props) {
  const { personId } = await params;
  const [person, entries] = await Promise.all([
    getCurrentUserPersonById(personId),
    getPersonLedger(personId),
  ]);

  if (!person) notFound();

  const balances = entries.reduce<Record<string, number>>((result, entry) => {
    result[entry.currency] =
      (result[entry.currency] ?? 0) + Number(entry.balance_effect);
    return result;
  }, {});

  const balanceItems = Object.entries(balances);

  return (
    <div className="space-y-8">
      <div>
        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link href="/people">
              <ArrowLeft className="size-4" />
              Back to people
            </Link>
          }
        />
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border bg-gradient-to-br from-primary/8 via-card to-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <CircleUserRound className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{person.name}</h1>
            <p className="mt-1 text-muted-foreground">
              Personal balance, repayments, and activity history.
            </p>
          </div>
        </div>
        <AddPersonEntryDialog personId={person.id} personName={person.name} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {balanceItems.length === 0 ? (
            <Card className="sm:col-span-2">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current balance</p>
                  <p className="mt-1 text-2xl font-semibold">Settled</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            balanceItems.map(([currency, balance]) => {
              const isOwedToYou = balance > 0;
              const Icon = isOwedToYou ? HandCoins : WalletCards;

              return (
                <Card key={currency}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current balance</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight">
                          {Math.abs(balance).toFixed(2)} {currency}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {isOwedToYou
                            ? `${person.name} owes you`
                            : `You owe ${person.name}`}
                        </p>
                      </div>
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Person details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="mt-1 font-medium">{person.phone || "Not added"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <NotebookText className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap font-medium">
                  {person.notes || "No notes"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Balance activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every entry shows how it changed the balance between you and {person.name}.
          </p>
        </div>
        <PersonLedger entries={entries} />
      </section>
    </div>
  );
}
