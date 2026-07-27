import type {
    PersonBalanceEntry,
    PersonEntryType,
} from "../types/person";

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

function formatEntryDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
}

export function PersonLedger({
    entries,
}: Props) {
    if (entries.length === 0) {
        return (
            <div className="rounded-xl border px-6 py-12 text-center">
                <p className="font-medium">
                    No balance activity yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                    Transactions and repayments involving this
                    person will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y rounded-xl border">
            {entries.map((entry) => {
                const isPositive =
                    entry.balance_effect > 0;

                return (
                    <div
                        key={entry.id}
                        className="flex items-center justify-between gap-4 px-6 py-5"
                    >
                        <div className="min-w-0">
                            <p className="font-medium">
                                {
                                    entryTypeLabels[
                                    entry.entry_type
                                    ]
                                }
                            </p>

                            {entry.description && (
                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                    {entry.description}
                                </p>
                            )}

                            <p className="mt-1 text-xs text-muted-foreground">
                                {formatEntryDate(
                                    entry.entry_date
                                )}
                            </p>
                        </div>

                        <p
                            className={
                                isPositive
                                    ? "shrink-0 font-semibold text-emerald-600 dark:text-emerald-400"
                                    : "shrink-0 font-semibold text-destructive"
                            }
                        >
                            {isPositive ? "+" : "−"}
                            {Math.abs(
                                entry.balance_effect
                            ).toFixed(2)}{" "}
                            {entry.currency}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}