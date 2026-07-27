import { BalanceStatus } from "../types/person";

export function getBalanceStatus(
    balance: number
): BalanceStatus {
    if (balance > 0) {
        return "owed_to_you";
    }

    if (balance < 0) {
        return "you_owe";
    }

    return "settled";
}

export function getAbsoluteBalance(
    balance: number
): number {
    return Math.abs(balance);
}