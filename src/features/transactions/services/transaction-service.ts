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
};

function sanitizeSearchTerm(value: string): string {
    return value
        .trim()
        .replace(/[(),]/g, " ")
        .replace(/\s+/g, " ");
}

export async function getCurrentUserTransactions(
    filters: TransactionFilters = {}
): Promise<TransactionListItem[]> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return [];
    }

    let query = supabase
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

    if (filters.date) {
        query = query.eq(
            "transaction_date",
            filters.date
        );
    }

    if (
        filters.type &&
        filters.type !== "all"
    ) {
        query = query.eq(
            "type",
            filters.type
        );
    }

    if (filters.accountId) {
        query = query.eq(
            "account_id",
            filters.accountId
        );
    }

    const searchTerm = sanitizeSearchTerm(
        filters.search ?? ""
    );

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
                .ilike("name", searchPattern),

            supabase
                .from("categories")
                .select("id")
                .eq("user_id", user.id)
                .ilike("name", searchPattern),

            supabase
                .from("payees")
                .select("id")
                .eq("user_id", user.id)
                .ilike("name", searchPattern),

            supabase
                .from("people")
                .select("id")
                .eq("user_id", user.id)
                .ilike("name", searchPattern),
        ]);

        const accountIds = (
            accountsResult.data ?? []
        ).map((account) => account.id);

        const categoryIds = (
            categoriesResult.data ?? []
        ).map((category) => category.id);

        const payeeIds = (
            payeesResult.data ?? []
        ).map((payee) => payee.id);

        const personIds = (
            peopleResult.data ?? []
        ).map((person) => person.id);

        let personTransactionIds:
            string[] = [];

        if (personIds.length > 0) {
            const {
                data: personEntries,
                error: personEntriesError,
            } = await supabase
                .from(
                    "person_balance_entries"
                )
                .select("transaction_id")
                .eq("user_id", user.id)
                .in("person_id", personIds);

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

        const conditions: string[] = [
            `notes.ilike.${searchPattern}`,
        ];

        if (accountIds.length > 0) {
            conditions.push(
                `account_id.in.(${accountIds.join(
                    ","
                )})`
            );
        }

        if (categoryIds.length > 0) {
            conditions.push(
                `category_id.in.(${categoryIds.join(
                    ","
                )})`
            );
        }

        if (payeeIds.length > 0) {
            conditions.push(
                `payee_id.in.(${payeeIds.join(
                    ","
                )})`
            );
        }

        if (
            personTransactionIds.length > 0
        ) {
            conditions.push(
                `id.in.(${personTransactionIds.join(
                    ","
                )})`
            );
        }

        const numericSearch = Number(
            searchTerm.replace(/,/g, "")
        );

        if (
            Number.isFinite(numericSearch) &&
            numericSearch >= 0
        ) {
            conditions.push(
                `amount.eq.${numericSearch}`
            );
        }

        query = query.or(
            conditions.join(",")
        );
    }

    const { data, error } = await query
        .order("transaction_date", {
            ascending: false,
        })
        .order("created_at", {
            ascending: false,
        });

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

        return [];
    }

    return (
        data ?? []
    ) as TransactionListItem[];
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