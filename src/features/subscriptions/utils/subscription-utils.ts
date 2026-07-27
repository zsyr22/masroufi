import type {
    SubscriptionBillingCycle,
    SubscriptionDurationType,
    SubscriptionStatus,
} from "@/features/subscriptions/types/subscription";

function formatDateValue(date: Date): string {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDateValue(value: string): Date {
    return new Date(`${value}T12:00:00`);
}

export function addMonthsToDate(
    dateValue: string,
    months: number
): string {
    const original = parseDateValue(dateValue);

    const originalDay = original.getDate();

    const result = new Date(
        original.getFullYear(),
        original.getMonth() + months,
        1,
        12
    );

    const lastDayOfTargetMonth = new Date(
        result.getFullYear(),
        result.getMonth() + 1,
        0
    ).getDate();

    result.setDate(
        Math.min(originalDay, lastDayOfTargetMonth)
    );

    return formatDateValue(result);
}

export function calculateContractEndDate(
    startDate: string,
    durationMonths: number
): string {
    const nextPeriodStart = parseDateValue(
        addMonthsToDate(
            startDate,
            durationMonths
        )
    );

    nextPeriodStart.setDate(
        nextPeriodStart.getDate() - 1
    );

    return formatDateValue(nextPeriodStart);
}

export function calculateMonthlyEquivalent(
    amount: number,
    billingCycle: SubscriptionBillingCycle
): number {
    switch (billingCycle) {
        case "one_time":
            return 0;

        case "weekly":
            return (amount * 52) / 12;

        case "monthly":
            return amount;

        case "quarterly":
            return amount / 3;

        case "yearly":
            return amount / 12;
    }
}

export function calculateYearlyEquivalent(
    amount: number,
    billingCycle: SubscriptionBillingCycle
): number {
    switch (billingCycle) {
        case "one_time":
            return amount;

        case "weekly":
            return amount * 52;

        case "monthly":
            return amount * 12;

        case "quarterly":
            return amount * 4;

        case "yearly":
            return amount;
    }
}

export function getNextSubscriptionPaymentDate(
    currentDate: string,
    billingCycle: SubscriptionBillingCycle
): string | null {
    switch (billingCycle) {
        case "one_time":
            return null;

        case "weekly": {
            const date = parseDateValue(currentDate);

            date.setDate(date.getDate() + 7);

            return formatDateValue(date);
        }

        case "monthly":
            return addMonthsToDate(currentDate, 1);

        case "quarterly":
            return addMonthsToDate(currentDate, 3);

        case "yearly":
            return addMonthsToDate(currentDate, 12);
    }
}

export function getBillingCycleLabel(
    billingCycle: SubscriptionBillingCycle
): string {
    const labels: Record<
        SubscriptionBillingCycle,
        string
    > = {
        one_time: "One-time payment",
        weekly: "Weekly",
        monthly: "Monthly",
        quarterly: "Every 3 months",
        yearly: "Yearly",
    };

    return labels[billingCycle];
}

export function getDurationTypeLabel(
    durationType: SubscriptionDurationType
): string {
    const labels: Record<
        SubscriptionDurationType,
        string
    > = {
        ongoing: "Ongoing",
        fixed_period: "Fixed period",
        payment_count: "Number of payments",
    };

    return labels[durationType];
}

export function getSubscriptionStatusLabel(
    status: SubscriptionStatus
): string {
    const labels: Record<
        SubscriptionStatus,
        string
    > = {
        active: "Active",
        paused: "Paused",
        cancelled: "Cancelled",
        completed: "Completed",
    };

    return labels[status];
}

export function isSubscriptionOverdue(
    nextPaymentDate: string | null,
    status: SubscriptionStatus
): boolean {
    if (
        status !== "active" ||
        !nextPaymentDate
    ) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paymentDate = new Date(
        `${nextPaymentDate}T00:00:00`
    );

    return paymentDate < today;
}

export function getDaysUntilPayment(
    nextPaymentDate: string | null
): number | null {
    if (!nextPaymentDate) {
        return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paymentDate = new Date(
        `${nextPaymentDate}T00:00:00`
    );

    const millisecondsPerDay =
        1000 * 60 * 60 * 24;

    return Math.ceil(
        (paymentDate.getTime() -
            today.getTime()) /
        millisecondsPerDay
    );
}

export function getRemainingPayments(
    totalPayments: number | null,
    paymentsMade: number
): number | null {
    if (totalPayments === null) {
        return null;
    }

    return Math.max(
        totalPayments - paymentsMade,
        0
    );
}
export function getEstimatedContractPayments({
    billingCycle,
    durationType,
    durationMonths,
    totalPayments,
}: {
    billingCycle: SubscriptionBillingCycle;
    durationType: SubscriptionDurationType;
    durationMonths: number | null;
    totalPayments: number | null;
}): number | null {
    if (durationType === "ongoing") {
        return null;
    }

    if (durationType === "payment_count") {
        return totalPayments;
    }

    if (
        durationType !== "fixed_period" ||
        durationMonths === null
    ) {
        return null;
    }

    switch (billingCycle) {
        case "one_time":
            return 1;

        case "weekly":
            return Math.max(
                1,
                Math.ceil(
                    (durationMonths * 52) / 12
                )
            );

        case "monthly":
            return Math.max(
                1,
                durationMonths
            );

        case "quarterly":
            return Math.max(
                1,
                Math.ceil(
                    durationMonths / 3
                )
            );

        case "yearly":
            return Math.max(
                1,
                Math.ceil(
                    durationMonths / 12
                )
            );
    }
}

export function calculateEstimatedContractValue({
    amount,
    billingCycle,
    durationType,
    durationMonths,
    totalPayments,
}: {
    amount: number;
    billingCycle: SubscriptionBillingCycle;
    durationType: SubscriptionDurationType;
    durationMonths: number | null;
    totalPayments: number | null;
}): number | null {
    const estimatedPayments =
        getEstimatedContractPayments({
            billingCycle,
            durationType,
            durationMonths,
            totalPayments,
        });

    if (estimatedPayments === null) {
        return null;
    }

    return amount * estimatedPayments;
}

export function getSubscriptionDurationLabel({
    durationType,
    durationMonths,
    totalPayments,
}: {
    durationType: SubscriptionDurationType;
    durationMonths: number | null;
    totalPayments: number | null;
}): string {
    if (durationType === "ongoing") {
        return "Ongoing";
    }

    if (durationType === "payment_count") {
        if (!totalPayments) {
            return "Fixed payments";
        }

        return totalPayments === 1
            ? "1 payment"
            : `${totalPayments} payments`;
    }

    if (!durationMonths) {
        return "Fixed period";
    }

    return durationMonths === 1
        ? "1 month"
        : `${durationMonths} months`;
}