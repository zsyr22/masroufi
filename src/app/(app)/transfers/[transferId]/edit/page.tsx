import {
    notFound,
    redirect,
} from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";

import { getCurrentUserAccounts } from "@/features/accounts/services/account-service";
import {
    TransferForm,
    type TransferFormInitialValues,
} from "@/features/transfers/components/transfer-form";
import { getCurrentUserTransferById } from "@/features/transfers/services/transfer-service";

type EditTransferPageProps = {
    params: Promise<{
        transferId: string;
    }>;
};

export default async function EditTransferPage({
    params,
}: EditTransferPageProps) {
    const { transferId } = await params;

    const [transfer, accounts] =
        await Promise.all([
            getCurrentUserTransferById(
                transferId
            ),
            getCurrentUserAccounts(),
        ]);

    if (!transfer) {
        notFound();
    }

    if (accounts.length < 2) {
        redirect("/accounts");
    }

    const initialValues: TransferFormInitialValues =
    {
        id: transfer.id,
        fromAccountId:
            transfer.from_account_id,
        toAccountId:
            transfer.to_account_id,
        amount: Number(
            transfer.amount
        ),
        transferDate:
            transfer.transfer_date,
        notes:
            transfer.notes ?? "",
    };

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <PageHeader
                title="Edit transfer"
                description="Update the transfer and recalculate both account balances."
            />

            <TransferForm
                mode="edit"
                accounts={accounts}
                initialValues={
                    initialValues
                }
            />
        </div>
    );
}