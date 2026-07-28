"use client";

import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

import { Button } from "@/components/ui/button";

type TransactionPaginationProps = {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
};

export function TransactionPagination({
    page,
    pageSize,
    totalCount,
    totalPages,
}: TransactionPaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams =
        useSearchParams();

    if (
        totalCount === 0 ||
        totalPages === 0
    ) {
        return null;
    }

    const start =
        (page - 1) * pageSize + 1;

    const end = Math.min(
        page * pageSize,
        totalCount
    );

    function navigateToPage(
        nextPage: number
    ) {
        const safePage = Math.min(
            totalPages,
            Math.max(1, nextPage)
        );

        const params =
            new URLSearchParams(
                searchParams.toString()
            );

        if (safePage === 1) {
            params.delete("page");
        } else {
            params.set(
                "page",
                String(safePage)
            );
        }

        const query = params.toString();

        router.push(
            query
                ? `${pathname}?${query}`
                : pathname,
            {
                scroll: false,
            }
        );
    }

    return (
        <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                    {start}–{end}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                    {totalCount}
                </span>{" "}
                transactions
            </p>

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        navigateToPage(
                            page - 1
                        )
                    }
                    disabled={page <= 1}
                    className="gap-2"
                >
                    <ChevronLeft className="size-4" />
                    Previous
                </Button>

                <p className="min-w-24 text-center text-sm text-muted-foreground">
                    Page{" "}
                    <span className="font-medium text-foreground">
                        {page}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                        {totalPages}
                    </span>
                </p>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        navigateToPage(
                            page + 1
                        )
                    }
                    disabled={
                        page >= totalPages
                    }
                    className="gap-2"
                >
                    Next
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}