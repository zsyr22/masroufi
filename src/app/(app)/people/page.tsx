import { AddPersonDialog } from "@/features/people/components/add-person-dialog";
import { PeopleList } from "@/features/people/components/people-list";
import { getCurrentUserPeopleBalances } from "@/features/people/services/people-service";

export default async function PeoplePage() {
  const people =
    await getCurrentUserPeopleBalances();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            People Balances
          </h1>

          <p className="mt-1 text-muted-foreground">
            Track money you owe or are
            owed.
          </p>
        </div>

        <AddPersonDialog />
      </div>

      <PeopleList people={people} />
    </div>
  );
}