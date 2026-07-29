import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";

import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import { TransferForm } from "@/features/transfers/components/transfer-form";

export default async function NewTransferPage() {
    const accounts =
        await getCurrentUserAccounts();

    if (accounts.length < 2) {
        redirect("/accounts");
    }

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <PageHeader
                title="New transfer"
                description="Move money between two accounts using the same currency."
            />

            <TransferForm
                accounts={accounts}
            />
        </div>
    );
}