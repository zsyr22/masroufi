import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { PersonLedger } from "@/features/people/components/person-ledger";
import {
    getCurrentUserPersonById,
    getPersonLedger,
} from "@/features/people/services/people-service";
import { AddPersonEntryDialog } from "@/features/people/components/add-person-entry-dialog";
type Props = {
    params: Promise<{
        personId: string;
    }>;
};

export default async function PersonDetailsPage({
    params,
}: Props) {
    const { personId } = await params;

    const [person, entries] = await Promise.all([
        getCurrentUserPersonById(personId),
        getPersonLedger(personId),
    ]);

    if (!person) {
        notFound();
    }

    const balances = entries.reduce<
        Record<string, number>
    >((result, entry) => {
        result[entry.currency] =
            (result[entry.currency] ?? 0) +
            Number(entry.balance_effect);

        return result;
    }, {});

    const balanceItems = Object.entries(balances);

    return (
        <div className="space-y-6">
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {person.name}
                    </h1>

                    <p className="mt-1 text-muted-foreground">
                        Balance history and repayments.
                    </p>
                </div>

                <AddPersonEntryDialog
                    personId={person.id}
                    personName={person.name}
                />
            </div>

            {balanceItems.length === 0 ? (
                <div className="rounded-xl border p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                            <CheckCircle2 className="size-5 text-muted-foreground" />
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Current balance
                            </p>

                            <p className="text-xl font-semibold">
                                Settled
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {balanceItems.map(
                        ([currency, balance]) => {
                            const isOwedToYou =
                                balance > 0;

                            const isYouOwe =
                                balance < 0;

                            return (
                                <div
                                    key={currency}
                                    className="rounded-xl border p-6"
                                >
                                    <p className="text-sm text-muted-foreground">
                                        Current balance
                                    </p>

                                    <p className="mt-2 text-2xl font-semibold">
                                        {Math.abs(
                                            balance
                                        ).toFixed(2)}{" "}
                                        {currency}
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {isOwedToYou &&
                                            `${person.name} owes you`}

                                        {isYouOwe &&
                                            `You owe ${person.name}`}

                                        {!isOwedToYou &&
                                            !isYouOwe &&
                                            "Settled"}
                                    </p>
                                </div>
                            );
                        }
                    )}
                </div>
            )}

            {(person.phone || person.notes) && (
                <div className="rounded-xl border p-6">
                    <h2 className="font-semibold">
                        Person details
                    </h2>

                    <div className="mt-4 space-y-3 text-sm">
                        {person.phone && (
                            <div>
                                <p className="text-muted-foreground">
                                    Phone
                                </p>

                                <p className="mt-1">
                                    {person.phone}
                                </p>
                            </div>
                        )}

                        {person.notes && (
                            <div>
                                <p className="text-muted-foreground">
                                    Notes
                                </p>

                                <p className="mt-1 whitespace-pre-wrap">
                                    {person.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">
                        Balance activity
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        All expenses, repayments, and
                        adjustments involving{" "}
                        {person.name}.
                    </p>
                </div>

                <PersonLedger entries={entries} />
            </section>
        </div>
    );
}