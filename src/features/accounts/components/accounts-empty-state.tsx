import { Landmark } from "lucide-react";

import { AddAccountDialog } from "@/features/accounts/components/add-account-dialog";
import { Card, CardContent } from "@/components/ui/card";

export function AccountsEmptyState() {
    return (
        <Card className="border-dashed bg-card/50">
            <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Landmark className="size-6" />
                </div>

                <h2 className="mt-5 text-lg font-semibold">
                    Add your first account
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Start with your main bank account, cash wallet, or a savings
                    balance. You can add more accounts later.
                </p>

                <div className="mt-6">
                    <AddAccountDialog />
                </div>
            </CardContent>
        </Card>
    );
}