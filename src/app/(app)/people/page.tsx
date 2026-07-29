import { PageHeader } from "@/components/shared/page-header";
import { AddPersonDialog } from "@/features/people/components/add-person-dialog";
import { PeopleList } from "@/features/people/components/people-list";
import { getCurrentUserPeopleBalances } from "@/features/people/services/people-service";

export default async function PeoplePage() {
  const people =
    await getCurrentUserPeopleBalances();

  return (
    <div className="space-y-6">
      <PageHeader
        title="People Balances"
        description="Track money you owe or are owed."
        action={<AddPersonDialog />}
      />

      <PeopleList people={people} />
    </div>
  );
}