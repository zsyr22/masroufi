import { PageHeader } from "@/components/shared/page-header";
import { AddPersonDialog } from "@/features/people/components/add-person-dialog";
import { PeopleList } from "@/features/people/components/people-list";
import { getCurrentUserPeopleBalances } from "@/features/people/services/people-service";

export default async function PeoplePage() {
  const people = await getCurrentUserPeopleBalances();

  return (
    <div className="space-y-7">
      <div className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/12 via-card to-violet-500/8 p-6 shadow-[0_24px_80px_rgba(217,70,239,0.08)] sm:p-8">
        <PageHeader
          title="People balances"
          description="Track money between you and the people in your life — clearly and without awkward spreadsheets."
          action={<AddPersonDialog />}
        />
      </div>

      <PeopleList people={people} />
    </div>
  );
}
