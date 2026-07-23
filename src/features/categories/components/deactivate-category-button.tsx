"use client";

import { Archive } from "lucide-react";

import { deactivateCategory } from "@/features/categories/actions/category-actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeactivateCategoryButtonProps = {
    categoryId: string;
    categoryName: string;
};

export function DeactivateCategoryButton({
    categoryId,
    categoryName,
}: DeactivateCategoryButtonProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger
                render={
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Deactivate ${categoryName}`}
                    />
                }
            >
                <Archive className="size-4" />
            </AlertDialogTrigger>

            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Deactivate {categoryName}?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        This category will no longer appear when adding new
                        transactions. Existing transactions will not be changed.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>
                        Cancel
                    </AlertDialogCancel>

                    <form action={deactivateCategory.bind(null, categoryId)}>
                        <AlertDialogAction
                            type="submit"
                            className="w-full sm:w-auto"
                        >
                            Deactivate
                        </AlertDialogAction>
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}