import type { CurrencyCode } from "@/features/accounts/types/account";

export type Bill = {
  id: string;
  name: string;
  provider: string | null;
  category_id: string;
  default_account_id: string | null;
  frequency: "monthly" | "quarterly" | "yearly";
  due_day: number | null;
  expected_amount: number | null;
  currency: CurrencyCode;
  bill_payments: {
    id: string;
    billing_month: string;
    amount: number;
    paid_at: string;
  }[];
};

export type BillPaymentHistoryItem = {
  id: string;
  billing_month: string;
  amount: number;
  paid_at: string;
  notes: string | null;
  bill: {
    id: string;
    name: string;
    provider: string | null;
    currency: CurrencyCode;
  } | null;
  transaction: {
    account: {
      name: string;
    } | null;
  } | null;
};
