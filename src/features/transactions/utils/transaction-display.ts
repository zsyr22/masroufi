import type { TransactionListItem } from "../services/transaction-service";

export function getTransactionDisplayTitle(
    transaction: TransactionListItem
): string {
    const personEntry =
        transaction.person_balance_entries?.[0];

    const personName =
        personEntry?.people?.name;

    if (personEntry && personName) {
        switch (personEntry.entry_type) {
            case "paid_for_person":
                return `Paid for ${personName}`;

            case "repayment_received":
                return `${personName} repaid you`;

            case "repayment_sent":
                return `Repaid ${personName}`;

            case "person_paid_for_me":
                return `${personName} paid for you`;

            case "adjustment":
                return `${personName} balance adjustment`;
        }
    }

    return (
        transaction.payees?.name ??
        transaction.categories?.name ??
        "Transaction"
    );
}