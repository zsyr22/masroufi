"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createTransactionSchema } from "@/features/transactions/schemas/transaction-schema";
import { createClient } from "@/lib/supabase/server";

export type CreateTransactionState = {
    success?: boolean;
    message?: string;
    fieldErrors?: {
        type?: string[];
        amount?: string[];
        accountId?: string[];
        categoryId?: string[];
        payeeName?: string[];
        payeeType?: string[];
        transactionDate?: string[];
        notes?: string[];
        involvesPerson?: string[];
        personId?: string[];
        personRelationship?: string[];
    };
};

type PersonRelationship =
    | "paid_for_person"
    | "repayment_received"
    | "repayment_sent";

function getBalanceEffect(
    relationship: PersonRelationship,
    amount: number
): number {
    switch (relationship) {
        case "paid_for_person":
            return amount;

        case "repayment_received":
            return -amount;

        case "repayment_sent":
            return amount;
    }
}

function getEntryDescription(
    payeeName?: string,
    notes?: string
): string | null {
    const description =
        notes?.trim() || payeeName?.trim();

    return description || null;
}

async function validatePerson(
    supabase: Awaited<
        ReturnType<typeof createClient>
    >,
    userId: string,
    personId: string
) {
    const { data, error } = await supabase
        .from("people")
        .select("id")
        .eq("id", personId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return data;
}

async function resolvePayeeId({
    supabase,
    userId,
    payeeName,
    payeeType,
}: {
    supabase: Awaited<
        ReturnType<typeof createClient>
    >;
    userId: string;
    payeeName?: string;
    payeeType: string;
}): Promise<{
    payeeId: string | null;
    errorMessage?: string;
}> {
    if (!payeeName?.trim()) {
        return {
            payeeId: null,
        };
    }

    const normalizedPayeeName =
        payeeName.trim();

    const { data: existingPayee } =
        await supabase
            .from("payees")
            .select("id")
            .eq("user_id", userId)
            .ilike("name", normalizedPayeeName)
            .eq("is_active", true)
            .maybeSingle();

    if (existingPayee) {
        return {
            payeeId: existingPayee.id,
        };
    }

    const { data: newPayee, error } =
        await supabase
            .from("payees")
            .insert({
                user_id: userId,
                name: normalizedPayeeName,
                type: payeeType,
            })
            .select("id")
            .single();

    if (error || !newPayee) {
        console.error("Create payee error:", {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
        });

        return {
            payeeId: null,
            errorMessage:
                "The store or payee could not be created.",
        };
    }

    return {
        payeeId: newPayee.id,
    };
}

function revalidateTransactionPages(
    transactionId?: string,
    personId?: string | null
) {
    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/people");

    if (transactionId) {
        revalidatePath(
            `/transactions/${transactionId}/edit`
        );
    }

    if (personId) {
        revalidatePath(`/people/${personId}`);
    }
}


async function getLinkedTransactionSource(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    transactionId: string
): Promise<"purchase" | "bill" | "subscription" | null> {
    const [purchaseResult, billPaymentResult, transactionResult] =
        await Promise.all([
            supabase
                .from("purchases")
                .select("id")
                .eq("transaction_id", transactionId)
                .eq("user_id", userId)
                .maybeSingle(),
            supabase
                .from("bill_payments")
                .select("id")
                .eq("transaction_id", transactionId)
                .eq("user_id", userId)
                .maybeSingle(),
            supabase
                .from("transactions")
                .select("subscription_id")
                .eq("id", transactionId)
                .eq("user_id", userId)
                .maybeSingle(),
        ]);

    if (purchaseResult.data) return "purchase";
    if (billPaymentResult.data) return "bill";
    if (transactionResult.data?.subscription_id) return "subscription";

    return null;
}

function getLinkedTransactionMessage(
    source: "purchase" | "bill" | "subscription"
): string {
    const label =
        source === "purchase"
            ? "purchase"
            : source === "bill"
              ? "bill payment"
              : "subscription";

    return `This transaction is managed by its ${label}. Open the original record to make changes.`;
}

export async function createTransaction(
    _previousState: CreateTransactionState,
    formData: FormData
): Promise<CreateTransactionState> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message:
                "Your session expired. Please sign in again.",
        };
    }

    const parsed =
        createTransactionSchema.safeParse({
            type: formData.get("type"),
            amount: formData.get("amount"),
            accountId: formData.get("accountId"),
            categoryId:
                formData.get("categoryId"),
            payeeName:
                formData.get("payeeName") ||
                undefined,
            payeeType: formData.get("payeeType"),
            transactionDate:
                formData.get("transactionDate"),
            notes:
                formData.get("notes") || undefined,
            involvesPerson:
                formData.get("involvesPerson"),
            personId:
                formData.get("personId") ||
                undefined,
            personRelationship:
                formData.get(
                    "personRelationship"
                ) || undefined,
        });

    if (!parsed.success) {
        return {
            message:
                "Please review the highlighted fields.",
            fieldErrors:
                parsed.error.flatten().fieldErrors,
        };
    }

    const input = parsed.data;

    const { data: account, error: accountError } =
        await supabase
            .from("accounts")
            .select("id, currency")
            .eq("id", input.accountId)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

    if (accountError || !account) {
        return {
            message:
                "The selected account could not be found.",
        };
    }

    const {
        data: category,
        error: categoryError,
    } = await supabase
        .from("categories")
        .select("id, transaction_type")
        .eq("id", input.categoryId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (categoryError || !category) {
        return {
            message:
                "The selected category could not be found.",
        };
    }

    if (
        category.transaction_type !== input.type
    ) {
        return {
            message:
                "The selected category does not match the transaction type.",
        };
    }

    if (
        input.involvesPerson &&
        input.personId
    ) {
        const person = await validatePerson(
            supabase,
            user.id,
            input.personId
        );

        if (!person) {
            return {
                message:
                    "The selected person could not be found.",
                fieldErrors: {
                    personId: [
                        "Select a valid active person.",
                    ],
                },
            };
        }
    }

    const payeeResult =
        await resolvePayeeId({
            supabase,
            userId: user.id,
            payeeName: input.payeeName,
            payeeType: input.payeeType,
        });

    if (payeeResult.errorMessage) {
        return {
            message: payeeResult.errorMessage,
        };
    }

    const {
        data: transaction,
        error: transactionError,
    } = await supabase
        .from("transactions")
        .insert({
            user_id: user.id,
            account_id: account.id,
            category_id: category.id,
            payee_id: payeeResult.payeeId,
            type: input.type,
            amount: input.amount,
            currency: account.currency,
            transaction_date:
                input.transactionDate,
            notes: input.notes || null,
        })
        .select("id")
        .single();

    if (transactionError || !transaction) {
        console.error(
            "Create transaction error:",
            {
                message: transactionError?.message,
                details:
                    transactionError?.details,
                hint: transactionError?.hint,
                code: transactionError?.code,
            }
        );

        return {
            message:
                "The transaction could not be saved.",
        };
    }

    if (
        input.involvesPerson &&
        input.personId &&
        input.personRelationship
    ) {
        const { error: entryError } =
            await supabase
                .from("person_balance_entries")
                .insert({
                    user_id: user.id,
                    person_id: input.personId,
                    transaction_id: transaction.id,
                    entry_type:
                        input.personRelationship,
                    balance_effect:
                        getBalanceEffect(
                            input.personRelationship,
                            input.amount
                        ),
                    currency: account.currency,
                    entry_date:
                        input.transactionDate,
                    description:
                        getEntryDescription(
                            input.payeeName,
                            input.notes
                        ),
                });

        if (entryError) {
            console.error(
                "Create linked person entry error:",
                {
                    message: entryError.message,
                    details: entryError.details,
                    hint: entryError.hint,
                    code: entryError.code,
                }
            );

            await supabase
                .from("transactions")
                .delete()
                .eq("id", transaction.id)
                .eq("user_id", user.id);

            return {
                message:
                    "The person balance could not be recorded, so the transaction was not saved.",
            };
        }
    }

    revalidateTransactionPages(
        transaction.id,
        input.personId
    );

    redirect("/transactions");
}

export type DeleteTransactionState = {
    success?: boolean;
    message?: string;
};

export async function deleteTransactions(
    transactionIds: string[]
): Promise<DeleteTransactionState> {
    if (
        transactionIds.length === 0 ||
        transactionIds.length > 100
    ) {
        return {
            message:
                "Select between 1 and 100 transactions.",
        };
    }

    const uniqueTransactionIds = [
        ...new Set(transactionIds),
    ];

    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message:
                "Your session expired. Please sign in again.",
        };
    }

    const {
        data: ownedTransactions,
        error: ownershipError,
    } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
        .in("id", uniqueTransactionIds);

    if (ownershipError) {
        console.error(
            "Validate bulk transaction ownership error:",
            {
                message: ownershipError.message,
                details: ownershipError.details,
                hint: ownershipError.hint,
                code: ownershipError.code,
            }
        );

        return {
            message:
                "The selected transactions could not be validated.",
        };
    }

    const ownedTransactionIds = (
        ownedTransactions ?? []
    ).map((transaction) => transaction.id);

    if (
        ownedTransactionIds.length !==
        uniqueTransactionIds.length
    ) {
        return {
            message:
                "One or more selected transactions could not be found.",
        };
    }

    const [linkedPurchases, linkedBillPayments, linkedSubscriptions] =
        await Promise.all([
            supabase
                .from("purchases")
                .select("transaction_id")
                .eq("user_id", user.id)
                .in("transaction_id", ownedTransactionIds),
            supabase
                .from("bill_payments")
                .select("transaction_id")
                .eq("user_id", user.id)
                .in("transaction_id", ownedTransactionIds),
            supabase
                .from("transactions")
                .select("id")
                .eq("user_id", user.id)
                .in("id", ownedTransactionIds)
                .not("subscription_id", "is", null),
        ]);

    const linkedIds = new Set([
        ...(linkedPurchases.data ?? []).map((row) => row.transaction_id),
        ...(linkedBillPayments.data ?? []).map((row) => row.transaction_id),
        ...(linkedSubscriptions.data ?? []).map((row) => row.id),
    ]);

    if (linkedIds.size > 0) {
        return {
            message:
                "One or more selected transactions are managed by a purchase, bill payment, or subscription. Delete them from their original record instead.",
        };
    }

    const {
        data: linkedEntries,
        error: linkedEntriesError,
    } = await supabase
        .from("person_balance_entries")
        .select("person_id")
        .eq("user_id", user.id)
        .in(
            "transaction_id",
            ownedTransactionIds
        );

    if (linkedEntriesError) {
        console.error(
            "Load bulk linked person entries error:",
            linkedEntriesError
        );
    }

    const { error: deleteError } =
        await supabase
            .from("transactions")
            .delete()
            .eq("user_id", user.id)
            .in(
                "id",
                ownedTransactionIds
            );

    if (deleteError) {
        console.error(
            "Bulk delete transactions error:",
            {
                message: deleteError.message,
                details: deleteError.details,
                hint: deleteError.hint,
                code: deleteError.code,
            }
        );

        return {
            message:
                "The selected transactions could not be deleted.",
        };
    }

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/people");
    revalidatePath("/reports");

    const affectedPersonIds = [
        ...new Set(
            (linkedEntries ?? []).map(
                (entry) => entry.person_id
            )
        ),
    ];

    for (const personId of affectedPersonIds) {
        revalidatePath(
            `/people/${personId}`
        );
    }

    return {
        success: true,
        message: `${ownedTransactionIds.length} transactions deleted successfully.`,
    };
}

export async function deleteTransaction(
    transactionId: string
): Promise<DeleteTransactionState> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message:
                "Your session expired. Please sign in again.",
        };
    }

    const {
        data: linkedEntry,
        error: linkedEntryError,
    } = await supabase
        .from("person_balance_entries")
        .select("person_id")
        .eq("transaction_id", transactionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (linkedEntryError) {
        console.error(
            "Load linked person entry error:",
            linkedEntryError
        );
    }

    const {
        data: transaction,
        error: transactionError,
    } = await supabase
        .from("transactions")
        .select("id")
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (transactionError || !transaction) {
        return {
            message:
                "The transaction could not be found.",
        };
    }

    const linkedSource =
        await getLinkedTransactionSource(
            supabase,
            user.id,
            transactionId
        );

    if (linkedSource) {
        return {
            message: getLinkedTransactionMessage(linkedSource),
        };
    }

    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId)
        .eq("user_id", user.id);

    if (error) {
        console.error(
            "Delete transaction error:",
            error
        );

        return {
            message:
                "The transaction could not be deleted.",
        };
    }

    revalidateTransactionPages(
        transactionId,
        linkedEntry?.person_id
    );

    return {
        success: true,
        message:
            "Transaction deleted successfully.",
    };
}

export async function updateTransaction(
    _previousState: CreateTransactionState,
    formData: FormData
): Promise<CreateTransactionState> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            message:
                "Your session expired. Please sign in again.",
        };
    }

    const transactionId =
        formData.get("transactionId");

    if (
        typeof transactionId !== "string" ||
        transactionId.trim().length === 0
    ) {
        return {
            message:
                "The transaction could not be found.",
        };
    }

    const parsed =
        createTransactionSchema.safeParse({
            type: formData.get("type"),
            amount: formData.get("amount"),
            accountId: formData.get("accountId"),
            categoryId:
                formData.get("categoryId"),
            payeeName:
                formData.get("payeeName") ||
                undefined,
            payeeType: formData.get("payeeType"),
            transactionDate:
                formData.get("transactionDate"),
            notes:
                formData.get("notes") || undefined,
            involvesPerson:
                formData.get("involvesPerson"),
            personId:
                formData.get("personId") ||
                undefined,
            personRelationship:
                formData.get(
                    "personRelationship"
                ) || undefined,
        });

    if (!parsed.success) {
        return {
            message:
                "Please review the highlighted fields.",
            fieldErrors:
                parsed.error.flatten().fieldErrors,
        };
    }

    const input = parsed.data;

    const {
        data: existingTransaction,
        error: existingTransactionError,
    } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (
        existingTransactionError ||
        !existingTransaction
    ) {
        return {
            message:
                "The transaction could not be found.",
        };
    }

    const linkedSource =
        await getLinkedTransactionSource(
            supabase,
            user.id,
            transactionId
        );

    if (linkedSource) {
        return {
            message: getLinkedTransactionMessage(linkedSource),
        };
    }

    const {
        data: existingPersonEntry,
        error: existingEntryError,
    } = await supabase
        .from("person_balance_entries")
        .select("*")
        .eq("transaction_id", transactionId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingEntryError) {
        return {
            message:
                "The linked person balance could not be loaded.",
        };
    }

    const { data: account, error: accountError } =
        await supabase
            .from("accounts")
            .select("id, currency")
            .eq("id", input.accountId)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

    if (accountError || !account) {
        return {
            message:
                "The selected account could not be found.",
        };
    }

    const {
        data: category,
        error: categoryError,
    } = await supabase
        .from("categories")
        .select("id, transaction_type")
        .eq("id", input.categoryId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (categoryError || !category) {
        return {
            message:
                "The selected category could not be found.",
        };
    }

    if (
        category.transaction_type !== input.type
    ) {
        return {
            message:
                "The selected category does not match the transaction type.",
        };
    }

    if (
        input.involvesPerson &&
        input.personId
    ) {
        const person = await validatePerson(
            supabase,
            user.id,
            input.personId
        );

        if (!person) {
            return {
                message:
                    "The selected person could not be found.",
                fieldErrors: {
                    personId: [
                        "Select a valid active person.",
                    ],
                },
            };
        }
    }

    const payeeResult =
        await resolvePayeeId({
            supabase,
            userId: user.id,
            payeeName: input.payeeName,
            payeeType: input.payeeType,
        });

    if (payeeResult.errorMessage) {
        return {
            message: payeeResult.errorMessage,
        };
    }

    const { error: updateError } =
        await supabase
            .from("transactions")
            .update({
                account_id: account.id,
                category_id: category.id,
                payee_id: payeeResult.payeeId,
                type: input.type,
                amount: input.amount,
                currency: account.currency,
                transaction_date:
                    input.transactionDate,
                notes: input.notes || null,
            })
            .eq("id", transactionId)
            .eq("user_id", user.id);

    if (updateError) {
        console.error(
            "Update transaction error:",
            updateError
        );

        return {
            message:
                "The transaction could not be updated.",
        };
    }

    let personSyncError:
        | { message: string }
        | null = null;

    if (
        input.involvesPerson &&
        input.personId &&
        input.personRelationship
    ) {
        const entryValues = {
            user_id: user.id,
            person_id: input.personId,
            transaction_id: transactionId,
            entry_type:
                input.personRelationship,
            balance_effect: getBalanceEffect(
                input.personRelationship,
                input.amount
            ),
            currency: account.currency,
            entry_date: input.transactionDate,
            description:
                getEntryDescription(
                    input.payeeName,
                    input.notes
                ),
        };

        if (existingPersonEntry) {
            const { error } = await supabase
                .from("person_balance_entries")
                .update(entryValues)
                .eq("id", existingPersonEntry.id)
                .eq("user_id", user.id);

            if (error) {
                personSyncError = error;
            }
        } else {
            const { error } = await supabase
                .from("person_balance_entries")
                .insert(entryValues);

            if (error) {
                personSyncError = error;
            }
        }
    } else if (existingPersonEntry) {
        const { error } = await supabase
            .from("person_balance_entries")
            .delete()
            .eq("id", existingPersonEntry.id)
            .eq("user_id", user.id);

        if (error) {
            personSyncError = error;
        }
    }

    if (personSyncError) {
        console.error(
            "Synchronize person balance error:",
            personSyncError
        );

        await supabase
            .from("transactions")
            .update({
                account_id:
                    existingTransaction.account_id,
                category_id:
                    existingTransaction.category_id,
                payee_id:
                    existingTransaction.payee_id,
                type: existingTransaction.type,
                amount:
                    existingTransaction.amount,
                currency:
                    existingTransaction.currency,
                transaction_date:
                    existingTransaction.transaction_date,
                notes:
                    existingTransaction.notes,
            })
            .eq("id", transactionId)
            .eq("user_id", user.id);

        return {
            message:
                "The person balance could not be synchronized, so the transaction changes were cancelled.",
        };
    }

    revalidateTransactionPages(
        transactionId,
        input.personId ??
        existingPersonEntry?.person_id
    );

    redirect("/transactions");
}