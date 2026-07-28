import type {
    Transaction,
    TransactionPersonEntry,
    TransactionType,
} from "@/features/transactions/types/transaction";
import { createClient } from "@/lib/supabase/server";

export type TransactionListItem = Transaction & {
    accounts: {
        name: string;
    } | null;

    categories: {
        name: string;
    } | null;

    payees: {
        name: string;
    } | null;

    person_balance_entries: TransactionPersonEntry[];
};

export type TransactionFilters = {
    date?: string;
    type?: TransactionType | "all";
    accountId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
};

export type PaginatedTransactions = {
    transactions: TransactionListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

function sanitizeSearchTerm(value: string): string {
    return value
        .trim()
        .replace(/[(),]/g, " ")
        .replace(/\s+/g, " ");
}

export async function getCurrentUserTransactions(
    filters: TransactionFilters = {}
): Promise<PaginatedTransactions> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    const requestedPage = Math.max(
        1,
        Math.floor(filters.page ?? 1)
    );

    const pageSize = Math.min(
        100,
        Math.max(
            1,
            Math.floor(
                filters.pageSize ?? 25
            )
        )
    );

    if (userError || !user) {
        return {
            transactions: [],
            totalCount: 0,
            page: 1,
            pageSize,
            totalPages: 0,
        };
    }

    const searchTerm =
        sanitizeSearchTerm(
            filters.search ?? ""
        );

    let accountIds: string[] = [];
    let categoryIds: string[] = [];
    let payeeIds: string[] = [];
    let personTransactionIds: string[] =
        [];

    if (searchTerm) {
        const searchPattern =
            `%${searchTerm}%`;

        const [
            accountsResult,
            categoriesResult,
            payeesResult,
            peopleResult,
        ] = await Promise.all([
            supabase
                .from("accounts")
                .select("id")
                .eq("user_id", user.id)
                .ilike(
                    "name",
                    searchPattern
                ),

            supabase
                .from("categories")
                .select("id")
                .eq("user_id", user.id)
                .ilike(
                    "name",
                    searchPattern
                ),

            supabase
                .from("payees")
                .select("id")
                .eq("user_id", user.id)
                .ilike(
                    "name",
                    searchPattern
                ),

            supabase
                .from("people")
                .select("id")
                .eq("user_id", user.id)
                .ilike(
                    "name",
                    searchPattern
                ),
        ]);

        accountIds = (
            accountsResult.data ?? []
        ).map(
            (account) => account.id
        );

        categoryIds = (
            categoriesResult.data ?? []
        ).map(
            (category) => category.id
        );

        payeeIds = (
            payeesResult.data ?? []
        ).map(
            (payee) => payee.id
        );

        const personIds = (
            peopleResult.data ?? []
        ).map(
            (person) => person.id
        );

        if (personIds.length > 0) {
            const {
                data: personEntries,
                error: personEntriesError,
            } = await supabase
                .from(
                    "person_balance_entries"
                )
                .select(
                    "transaction_id"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .in(
                    "person_id",
                    personIds
                );

            if (personEntriesError) {
                console.error(
                    "Search linked person transactions error:",
                    {
                        message:
                            personEntriesError.message,
                        details:
                            personEntriesError.details,
                        hint:
                            personEntriesError.hint,
                        code:
                            personEntriesError.code,
                    }
                );
            }

            personTransactionIds = [
                ...new Set(
                    (
                        personEntries ?? []
                    )
                        .map(
                            (entry) =>
                                entry.transaction_id
                        )
                        .filter(
                            (
                                transactionId
                            ): transactionId is string =>
                                Boolean(
                                    transactionId
                                )
                        )
                ),
            ];
        }
    }

    function applyFilters<
        T extends {
            eq: (
                column: string,
                value: unknown
            ) => T;
            or: (
                filters: string
            ) => T;
        }
    >(inputQuery: T): T {
        let filteredQuery =
            inputQuery;

        if (filters.date) {
            filteredQuery =
                filteredQuery.eq(
                    "transaction_date",
                    filters.date
                );
        }

        if (
            filters.type &&
            filters.type !== "all"
        ) {
            filteredQuery =
                filteredQuery.eq(
                    "type",
                    filters.type
                );
        }

        if (filters.accountId) {
            filteredQuery =
                filteredQuery.eq(
                    "account_id",
                    filters.accountId
                );
        }

        if (searchTerm) {
            const searchPattern =
                `%${searchTerm}%`;

            const conditions: string[] =
                [
                    `notes.ilike.${searchPattern}`,
                ];

            if (
                accountIds.length > 0
            ) {
                conditions.push(
                    `account_id.in.(${accountIds.join(
                        ","
                    )})`
                );
            }

            if (
                categoryIds.length > 0
            ) {
                conditions.push(
                    `category_id.in.(${categoryIds.join(
                        ","
                    )})`
                );
            }

            if (
                payeeIds.length > 0
            ) {
                conditions.push(
                    `payee_id.in.(${payeeIds.join(
                        ","
                    )})`
                );
            }

            if (
                personTransactionIds.length >
                0
            ) {
                conditions.push(
                    `id.in.(${personTransactionIds.join(
                        ","
                    )})`
                );
            }

            const numericSearch =
                Number(
                    searchTerm.replace(
                        /,/g,
                        ""
                    )
                );

            if (
                Number.isFinite(
                    numericSearch
                ) &&
                numericSearch >= 0
            ) {
                conditions.push(
                    `amount.eq.${numericSearch}`
                );
            }

            filteredQuery =
                filteredQuery.or(
                    conditions.join(",")
                );
        }

        return filteredQuery;
    }

    let countQuery = supabase
        .from("transactions")
        .select("id", {
            count: "exact",
            head: true,
        })
        .eq("user_id", user.id);

    countQuery =
        applyFilters(countQuery);

    const {
        count,
        error: countError,
    } = await countQuery;

    if (countError) {
        console.error(
            "Count transactions error:",
            {
                message:
                    countError.message,
                details:
                    countError.details,
                hint: countError.hint,
                code: countError.code,
            }
        );

        return {
            transactions: [],
            totalCount: 0,
            page: requestedPage,
            pageSize,
            totalPages: 0,
        };
    }

    const totalCount = count ?? 0;

    const totalPages =
        totalCount === 0
            ? 0
            : Math.ceil(
                totalCount / pageSize
            );

    const page =
        totalPages === 0
            ? 1
            : Math.min(
                requestedPage,
                totalPages
            );

    const from =
        (page - 1) * pageSize;

    const to =
        from + pageSize - 1;

    let dataQuery = supabase
        .from("transactions")
        .select(`
            *,
            accounts (
                name
            ),
            categories (
                name
            ),
            payees (
                name
            ),
            person_balance_entries (
                entry_type,
                people (
                    name
                )
            )
        `)
        .eq("user_id", user.id);

    dataQuery =
        applyFilters(dataQuery);

    const { data, error } =
        await dataQuery
            .order(
                "transaction_date",
                {
                    ascending: false,
                }
            )
            .order("created_at", {
                ascending: false,
            })
            .range(from, to);

    if (error) {
        console.error(
            "Load transactions error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return {
            transactions: [],
            totalCount,
            page,
            pageSize,
            totalPages,
        };
    }

    return {
        transactions:
            (data ??
                []) as TransactionListItem[],
        totalCount,
        page,
        pageSize,
        totalPages,
    };
}

export async function getCurrentUserTransactionById(
    transactionId: string
) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data, error } = await supabase
        .from("transactions")
        .select(`
            id,
            type,
            amount,
            currency,
            transaction_date,
            notes,
            account_id,
            category_id,
            payee_id,
            accounts (
                id,
                name,
                currency
            ),
            categories (
                id,
                name,
                transaction_type
            ),
            payees (
                id,
                name,
                type
            )
        `)
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "Get transaction by id error:",
            {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }
        );

        return null;
    }

    return data;
}