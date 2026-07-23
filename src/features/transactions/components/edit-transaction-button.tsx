import Link from "next/link";
import { Pencil } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditTransactionButtonProps = {
    transactionId: string;
    transactionName: string;
};

export function EditTransactionButton({
    transactionId,
    transactionName,
}: EditTransactionButtonProps) {
    return (
        <Link
            href={`/transactions/${transactionId}/edit`}
            aria-label={`Edit ${transactionName}`}
            className={cn(
                buttonVariants({
                    variant: "ghost",
                    size: "icon-sm",
                })
            )}
        >
            <Pencil className="size-4" />
        </Link>
    );
}