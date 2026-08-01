import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleUserRound,
  HandCoins,
  NotebookText,
  Phone,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddPersonEntryDialog } from "@/features/people/components/add-person-entry-dialog";
import { DeletePersonButton } from "@/features/people/components/delete-person-button";
import { EditPersonDialog } from "@/features/people/components/edit-person-dialog";
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

  const balanceItems = Object.entries(balances).filter(([, balance]) => balance !== 0);

  return (
    <div className="space-y-7">
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

      <section className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/14 via-card to-violet-500/10 p-6 shadow-[0_24px_90px_rgba(217,70,239,0.10)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_16px_45px_rgba(217,70,239,0.12)]">
              <CircleUserRound className="size-8" />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-fuchsia-300">
                <Sparkles className="size-3.5" />
                Personal ledger
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{person.name}</h1>
              <p className="mt-1 text-muted-foreground">
                Personal balance, repayments, and activity history.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <EditPersonDialog person={person} />
            <DeletePersonButton
              personId={person.id}
              personName={person.name}
              redirectAfterDelete
            />
            <AddPersonEntryDialog personId={person.id} personName={person.name} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {balanceItems.length === 0 ? (
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-card to-card shadow-[0_20px_60px_rgba(16,185,129,0.08)] sm:col-span-2">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current balance</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-300">Settled</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nothing is currently owed in either direction.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            balanceItems.map(([currency, balance]) => {
              const isOwedToYou = balance > 0;
              const Icon = isOwedToYou ? HandCoins : WalletCards;
              const theme = isOwedToYou
                ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-card to-card"
                : "border-rose-500/20 bg-gradient-to-br from-rose-500/12 via-card to-card";
              const accent = isOwedToYou ? "text-emerald-300" : "text-rose-300";
              const iconClass = isOwedToYou
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400";

              return (
                <Card key={currency} className={`${theme} transition duration-300 hover:-translate-y-0.5 hover:shadow-xl`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current balance</p>
                        <p className={`mt-2 text-3xl font-semibold tracking-tight ${accent}`}>
                          {Math.abs(balance).toFixed(2)} {currency}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {isOwedToYou
                            ? `${person.name} owes you`
                            : `You owe ${person.name}`}
                        </p>
                      </div>
                      <div className={`flex size-11 items-center justify-center rounded-2xl ${iconClass}`}>
                        <Icon className="size-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card className="border-fuchsia-500/15 bg-gradient-to-br from-fuchsia-500/7 via-card to-card">
          <CardHeader>
            <CardTitle className="text-base">Person details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-background/30 p-3">
              <Phone className="mt-0.5 size-4 text-fuchsia-300" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
                <p className="mt-1 font-medium">{person.phone || "Not added"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-background/30 p-3">
              <NotebookText className="mt-0.5 size-4 text-fuchsia-300" />
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
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-fuchsia-400" />
          <div>
            <h2 className="text-xl font-semibold">Balance activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every entry shows how it changed the balance between you and {person.name}.
            </p>
          </div>
        </div>
        <PersonLedger entries={entries} />
      </section>
    </div>
  );
}
