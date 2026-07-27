import {
    PersonBalance,
} from "../types/person";

import { PeopleListItem } from "./people-list-item";

type Props = {
    people: PersonBalance[];
};

export function PeopleList({
    people,
}: Props) {

    if (people.length === 0) {
        return (
            <div className="rounded-xl border p-12 text-center text-sm text-muted-foreground">
                No people yet.
            </div>
        );
    }

    return (
        <div className="divide-y rounded-xl border">

            {people.map((person) => (
                <PeopleListItem
                    key={person.person_id}
                    person={person}
                />
            ))}

        </div>
    );
}