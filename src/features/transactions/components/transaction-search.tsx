"use client";

import {
    useEffect,
    useState,
    useTransition,
} from "react";
import {
    Loader2,
    Search,
    X,
} from "lucide-react";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TransactionSearchProps = {
    initialQuery: string;
};

export function TransactionSearch({
    initialQuery,
}: TransactionSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams =
        useSearchParams();

    const [value, setValue] =
        useState(initialQuery);

    const [isPending, startTransition] =
        useTransition();

    useEffect(() => {
        setValue(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        const timeout = window.setTimeout(
            () => {
                const normalizedValue =
                    value.trim();

                if (
                    normalizedValue ===
                    initialQuery
                ) {
                    return;
                }

                const params =
                    new URLSearchParams(
                        searchParams.toString()
                    );

                if (normalizedValue) {
                    params.set(
                        "q",
                        normalizedValue
                    );
                } else {
                    params.delete("q");
                }

                startTransition(() => {
                    const query =
                        params.toString();

                    router.replace(
                        query
                            ? `${pathname}?${query}`
                            : pathname,
                        {
                            scroll: false,
                        }
                    );
                });
            },
            350
        );

        return () => {
            window.clearTimeout(timeout);
        };
    }, [
        value,
        initialQuery,
        pathname,
        router,
        searchParams,
    ]);

    function clearSearch() {
        setValue("");

        const params =
            new URLSearchParams(
                searchParams.toString()
            );

        params.delete("q");

        startTransition(() => {
            const query =
                params.toString();

            router.replace(
                query
                    ? `${pathname}?${query}`
                    : pathname,
                {
                    scroll: false,
                }
            );
        });
    }

    return (
        <div className="rounded-2xl border bg-card p-4">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    type="search"
                    value={value}
                    onChange={(event) =>
                        setValue(
                            event.target.value
                        )
                    }
                    placeholder="Search by store, category, account, person, notes, or amount..."
                    aria-label="Search transactions"
                    className="h-11 pl-10 pr-20"
                />

                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {isPending ? (
                        <Loader2 className="mr-1 size-4 animate-spin text-muted-foreground" />
                    ) : null}

                    {value ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={
                                clearSearch
                            }
                            aria-label="Clear transaction search"
                        >
                            <X className="size-4" />
                        </Button>
                    ) : null}
                </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
                Search updates automatically
                while you type and works together
                with the filters below.
            </p>
        </div>
    );
}