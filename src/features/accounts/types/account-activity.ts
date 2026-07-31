import type { CurrencyCode } from "@/features/accounts/types/account";

export type AccountActivityKind =
  | "opening_balance"
  | "income"
  | "expense"
  | "transfer_in"
  | "transfer_out";

export type AccountActivityItem = {
  id: string;
  kind: AccountActivityKind;
  title: string;
  subtitle: string | null;
  amount: number;
  currency: CurrencyCode;
  occurredAt: string;
  sourceId: string | null;
};

export type AccountDetailsData = {
  account: import("@/features/accounts/types/account").AccountWithBalance;
  moneyIn: number;
  moneyOut: number;
  transactionIncome: number;
  transactionExpenses: number;
  transfersIn: number;
  transfersOut: number;
  activities: AccountActivityItem[];
};
