import {
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react";

import { DeactivateCategoryButton } from "@/features/categories/components/deactivate-category-button";
import type {
    Category,
    TransactionType,
} from "@/features/transactions/types/transaction";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CategoryListProps = {
    title: string;
    description: string;
    type: TransactionType;
    categories: Category[];
};

export function CategoryList({
    title,
    description,
    type,
    categories,
}: CategoryListProps) {
    const isIncome = type === "income";
    const Icon = isIncome
        ? ArrowDownLeft
        : ArrowUpRight;

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">
                    {title}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                </p>
            </div>

            <Card className="overflow-hidden border-orange-500/15 bg-gradient-to-br from-orange-500/6 via-card to-transparent">
                <CardContent className="divide-y divide-border p-0">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <div
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                                        isIncome
                                            ? "bg-primary/10 text-primary"
                                            : "bg-destructive/10 text-destructive"
                                    )}
                                >
                                    <Icon className="size-4" />
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {category.name}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {category.is_system
                                            ? "Default category"
                                            : "Custom category"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {category.is_system ? (
                                    <Badge variant="secondary">
                                        Default
                                    </Badge>
                                ) : (
                                    <DeactivateCategoryButton
                                        categoryId={category.id}
                                        categoryName={category.name}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </section>
    );
}