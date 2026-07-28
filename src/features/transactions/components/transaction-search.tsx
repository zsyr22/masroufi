"use client";

import {
    Search,
    X,
} from "lucide-react";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";
import {
    FormEvent,
    useEffect,
    useRef,
    useState,
    useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TransactionSearchProps = {
    initialQuery?: string;
};

const SEARCH_DELAY = 700;

export function TransactionSearch({
    initialQuery = "",
}: TransactionSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams =
        useSearchParams();

    const [value, setValue] =
        useState(initialQuery);

    const [isPending, startTransition] =
        useTransition();

    const isFirstRender = useRef(true);
    const lastAppliedQuery =
        useRef(initialQuery.trim());

    function applySearch(
        rawValue: string
    ) {
        const normalizedValue =
            rawValue.trim();

        if (
            normalizedValue ===
            lastAppliedQuery.current
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

        params.delete("page");

        const query = params.toString();

        lastAppliedQuery.current =
            normalizedValue;

        startTransition(() => {
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

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId =
            window.setTimeout(() => {
                applySearch(value);
            }, SEARCH_DELAY);

        return () => {
            window.clearTimeout(
                timeoutId
            );
        };
        // applySearch deliberately uses the latest
        // searchParams from the current render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        applySearch(value);
    }

    function clearSearch() {
        setValue("");

        const params =
            new URLSearchParams(
                searchParams.toString()
            );

        params.delete("q");
        params.delete("page");

        lastAppliedQuery.current = "";

        const query = params.toString();

        startTransition(() => {
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
        <form
            onSubmit={handleSubmit}
            className="space-y-2"
        >
            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    type="text"
                    value={value}
                    onChange={(event) =>
                        setValue(
                            event.target.value
                        )
                    }
                    placeholder="Search by store, category, account, person, notes, or amount..."
                    autoComplete="off"
                    spellCheck={false}
                    className="h-12 pl-11 pr-24"
                />

                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {isPending && (
                        <span className="px-2 text-xs text-muted-foreground">
                            Searching…
                        </span>
                    )}

                    {value.length > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={
                                clearSearch
                            }
                            aria-label="Clear search"
                            className="size-8"
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                Search runs after you stop
                typing. Press Enter to search
                immediately.
            </p>
        </form>
    );
}