"use client";

import {
    CalendarDays,
    FilterX,
    Landmark,
    ListFilter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Account } from "@/features/accounts/types/account";
import type { TransactionType } from "@/features/transactions/types/transaction";
import {
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";

type TransactionFiltersProps = {
    accounts: Account[];
    date: string;
    type: TransactionType | "all";
    accountId: string;
};

function formatDateLabel(dateValue: string) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

export function TransactionFilters({
    accounts,
    date,
    type,
    accountId,
}: TransactionFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const currentSearchParams =
        useSearchParams();

    const hasSearch =
        Boolean(
            currentSearchParams.get("q")
        );
    const selectedAccount = accounts.find(
        (account) => account.id === accountId
    );

    const accountItems = [
        {
            value: "all",
            label: "All accounts",
        },
        ...accounts.map((account) => ({
            value: account.id,
            label: account.name,
        })),
    ];

    const typeItems = [
        {
            value: "all",
            label: "All types",
        },
        {
            value: "expense",
            label: "Expenses",
        },
        {
            value: "income",
            label: "Income",
        },
    ];

    function navigate(params: URLSearchParams) {
        const query = params.toString();

        router.push(
            query
                ? `${pathname}?${query}`
                : pathname
        );
    }

    function updateFilter(
        key: string,
        value: string
    ) {
        const params = new URLSearchParams(
            window.location.search
        );

        if (!value || value === "all") {
            params.delete(key);
        } else {
            params.set(key, value);
        }

        // تنظيف أي رابط قديم ما زال يحتوي month
        params.delete("month");

        navigate(params);
    }

    function removeFilter(key: string) {
        const params = new URLSearchParams(
            window.location.search
        );

        params.delete(key);
        params.delete("month");

        navigate(params);
    }

    function clearFilters() {
        router.push(pathname);
    }

    const hasActiveFilters =
        hasSearch ||
        Boolean(date) ||
        type !== "all" ||
        Boolean(accountId);

    return (
        <div className="space-y-4 rounded-2xl border bg-card p-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                    <label
                        htmlFor="transaction-date-filter"
                        className="block text-xs font-medium text-muted-foreground"
                    >
                        Date
                    </label>

                    <Input
                        id="transaction-date-filter"
                        type="date"
                        value={date}
                        onChange={(event) =>
                            updateFilter("date", event.target.value)
                        }
                        className="h-10 w-full px-3"
                    />
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Type
                    </p>

                    <Select
                        items={typeItems}
                        value={type}
                        onValueChange={(value) => {
                            if (value) {
                                updateFilter(
                                    "type",
                                    value
                                );
                            }
                        }}
                    >
                        <SelectTrigger className="h-10 w-full px-3">                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            {typeItems.map((item) => (
                                <SelectItem
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Account
                    </p>

                    <Select
                        items={accountItems}
                        value={accountId || "all"}
                        onValueChange={(value) => {
                            if (value) {
                                updateFilter(
                                    "account",
                                    value
                                );
                            }
                        }}
                    >
                        <SelectTrigger className="h-10 w-full px-3">                            <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                            {accountItems.map((account) => (
                                <SelectItem
                                    key={account.value}
                                    value={account.value}
                                >
                                    {account.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="mr-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <ListFilter className="size-4" />

                        {hasActiveFilters
                            ? "Active filters:"
                            : "Showing all transactions"}
                    </div>

                    {date ? (
                        <Badge
                            variant="secondary"
                            className="gap-1.5"
                        >
                            <CalendarDays className="size-3" />
                            Date: {formatDateLabel(date)}

                            <button
                                type="button"
                                onClick={() =>
                                    removeFilter("date")
                                }
                                className="ml-1 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Remove date filter"
                            >
                                ×
                            </button>
                        </Badge>
                    ) : null}

                    {type !== "all" ? (
                        <Badge
                            variant="secondary"
                            className="gap-1.5 capitalize"
                        >
                            <ListFilter className="size-3" />
                            Type: {type}

                            <button
                                type="button"
                                onClick={() =>
                                    removeFilter("type")
                                }
                                className="ml-1 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Remove type filter"
                            >
                                ×
                            </button>
                        </Badge>
                    ) : null}

                    {selectedAccount ? (
                        <Badge
                            variant="secondary"
                            className="gap-1.5"
                        >
                            <Landmark className="size-3" />
                            Account: {selectedAccount.name}

                            <button
                                type="button"
                                onClick={() =>
                                    removeFilter("account")
                                }
                                className="ml-1 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Remove account filter"
                            >
                                ×
                            </button>
                        </Badge>
                    ) : null}
                </div>

                <Button
                    type="button"
                    variant="outline"
                    disabled={!hasActiveFilters}
                    onClick={clearFilters}
                    className="h-9 shrink-0 gap-2"
                >
                    <FilterX className="size-4" />
                    Clear filters
                </Button>
            </div>
        </div>
    );
}