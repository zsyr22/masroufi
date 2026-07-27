import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    TrendingDown,
    TrendingUp,
    Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { PersonBalance } from "../types/person";
import {
    getAbsoluteBalance,
    getBalanceStatus,
} from "../utils/balance";

type Props = {
    people: PersonBalance[];
};

type CurrencySummary = {
    owedToYou: number;
    youOwe: number;
};

function getCurrencySummaries(
    people: PersonBalance[]
) {
    return people.reduce<
        Record<string, CurrencySummary>
    >((result, person) => {
        if (!person.currency) {
            return result;
        }

        const balance = Number(
            person.current_balance
        );

        if (!result[person.currency]) {
            result[person.currency] = {
                owedToYou: 0,
                youOwe: 0,
            };
        }

        if (balance > 0) {
            result[person.currency].owedToYou +=
                balance;
        }

        if (balance < 0) {
            result[person.currency].youOwe +=
                Math.abs(balance);
        }

        return result;
    }, {});
}

export function DashboardPeopleBalances({
    people,
}: Props) {
    const activeBalances = people
        .filter(
            (person) =>
                Number(person.current_balance) !== 0
        )
        .slice(0, 5);

    const summaries =
        getCurrencySummaries(people);

    const summaryEntries =
        Object.entries(summaries);

    return (
        <section className="h-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Users className="size-5 text-primary" />

                        <h2 className="font-semibold">
                            People balances
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Money you owe or are owed.
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={
                        <Link href="/people">
                            View all
                            <ArrowRight className="size-4" />
                        </Link>
                    }
                />
            </div>

            {summaryEntries.length > 0 && (
                <div
                    className={
                        summaryEntries.length > 1
                            ? "grid border-y bg-muted/20 sm:grid-cols-2"
                            : "grid border-y bg-muted/20"
                    }
                >
                    {summaryEntries.map(
                        ([currency, summary], index) => (
                            <div
                                key={currency}
                                className={
                                    summaryEntries.length > 1 &&
                                        index <
                                        summaryEntries.length - 1
                                        ? "grid grid-cols-2 gap-4 px-6 py-4 sm:border-r"
                                        : "grid grid-cols-2 gap-4 px-6 py-4"
                                }
                            >
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <TrendingUp className="size-3.5 text-emerald-500" />
                                        Owed to you
                                    </div>

                                    <p className="mt-2 font-semibold text-emerald-500">
                                        {summary.owedToYou.toFixed(
                                            2
                                        )}{" "}
                                        {currency}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <TrendingDown className="size-3.5 text-destructive" />
                                        You owe
                                    </div>

                                    <p className="mt-2 font-semibold text-destructive">
                                        {summary.youOwe.toFixed(
                                            2
                                        )}{" "}
                                        {currency}
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {activeBalances.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                        <CheckCircle2 className="size-5 text-emerald-500" />
                    </div>

                    <p className="mt-3 font-medium">
                        All balances are settled
                    </p>

                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        No one currently owes you money,
                        and you do not owe anyone.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {activeBalances.map((person) => {
                        const balance = Number(
                            person.current_balance
                        );

                        const status =
                            getBalanceStatus(balance);

                        return (
                            <Link
                                key={`${person.person_id}-${person.currency}`}
                                href={`/people/${person.person_id}`}
                                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {person.name}
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {status ===
                                            "owed_to_you" &&
                                            "Owes you"}

                                        {status ===
                                            "you_owe" &&
                                            "You owe"}
                                    </p>
                                </div>

                                <p
                                    className={
                                        status === "owed_to_you"
                                            ? "shrink-0 font-semibold text-emerald-500"
                                            : "shrink-0 font-semibold text-destructive"
                                    }
                                >
                                    {getAbsoluteBalance(
                                        balance
                                    ).toFixed(2)}{" "}
                                    {person.currency}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}