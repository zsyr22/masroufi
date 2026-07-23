"use client";

import { useActionState, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Plus,
    Tags,
} from "lucide-react";

import {
    createCategory,
    type CategoryActionState,
} from "@/features/categories/actions/category-actions";
import type { TransactionType } from "@/features/transactions/types/transaction";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: CategoryActionState = {};

type CategoryFormProps = {
    onCancel: () => void;
    onComplete: () => void;
};

function CategoryForm({
    onCancel,
    onComplete,
}: CategoryFormProps) {
    const [transactionType, setTransactionType] =
        useState<TransactionType>("expense");

    const [state, formAction, isPending] = useActionState(
        createCategory,
        initialState
    );

    if (state.success) {
        return (
            <div className="space-y-6 py-2">
                <div className="flex flex-col items-center text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CheckCircle2 className="size-7" />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold">
                        Category created
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                        The category is ready to use with new transactions.
                    </p>
                </div>

                <Button
                    type="button"
                    className="w-full"
                    onClick={onComplete}
                >
                    Done
                </Button>
            </div>
        );
    }

    return (
        <form action={formAction} className="space-y-5">
            <input
                type="hidden"
                name="transactionType"
                value={transactionType}
            />

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-1">
                <button
                    type="button"
                    onClick={() => setTransactionType("expense")}
                    className={cn(
                        "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                        transactionType === "expense"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <ArrowUpRight className="size-4 text-destructive" />
                    Expense
                </button>

                <button
                    type="button"
                    onClick={() => setTransactionType("income")}
                    className={cn(
                        "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                        transactionType === "income"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <ArrowDownLeft className="size-4 text-primary" />
                    Income
                </button>
            </div>

            <div className="space-y-2">
                <Label htmlFor="categoryName">
                    Category name
                </Label>

                <Input
                    id="categoryName"
                    name="name"
                    placeholder={
                        transactionType === "expense"
                            ? "Coffee, Parking, Gifts..."
                            : "Freelance, Bonus..."
                    }
                    autoComplete="off"
                    required
                />

                {state.fieldErrors?.name?.[0] ? (
                    <p className="text-xs text-destructive">
                        {state.fieldErrors.name[0]}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Choose a clear name that describes the transaction purpose.
                    </p>
                )}
            </div>

            {state.message ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.message}
                </p>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isPending}
                >
                    Cancel
                </Button>

                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create category"}
                </Button>
            </div>
        </form>
    );
}

export function AddCategoryDialog() {
    const [open, setOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);

    function resetAndClose() {
        setOpen(false);
        setFormKey((current) => current + 1);
    }

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);

        if (!nextOpen) {
            setFormKey((current) => current + 1);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger
                render={
                    <Button>
                        <Plus className="size-4" />
                        Add category
                    </Button>
                }
            />

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Tags className="size-5" />
                    </div>

                    <DialogTitle>Add category</DialogTitle>

                    <DialogDescription>
                        Create a custom income or expense category.
                    </DialogDescription>
                </DialogHeader>

                <CategoryForm
                    key={formKey}
                    onCancel={resetAndClose}
                    onComplete={resetAndClose}
                />
            </DialogContent>
        </Dialog>
    );
}