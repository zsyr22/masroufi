import Link from "next/link";

import {
    getAbsoluteBalance,
    getBalanceStatus,
} from "../utils/balance";
import type { PersonBalance } from "../types/person";

type Props = {
    person: PersonBalance;
};

export function PeopleListItem({
    person,
}: Props) {
    const balance = Number(person.current_balance);

    const status = getBalanceStatus(balance);
    const amount = getAbsoluteBalance(balance);

    return (
        <Link
            href={`/people/${person.person_id}`}
            className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-muted/40"
        >
            <div className="min-w-0">
                <p className="truncate font-medium">
                    {person.name}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                    {status === "owed_to_you" &&
                        "Owes you"}

                    {status === "you_owe" &&
                        "You owe"}

                    {status === "settled" &&
                        "Settled"}
                </p>
            </div>

            <div className="shrink-0 text-right">
                {status === "settled" ? (
                    <p className="font-semibold text-muted-foreground">
                        Settled
                    </p>
                ) : (
                    <p className="font-semibold">
                        {amount.toFixed(2)}{" "}
                        {person.currency}
                    </p>
                )}
            </div>
        </Link>
    );
}