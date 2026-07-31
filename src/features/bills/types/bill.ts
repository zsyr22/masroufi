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
  is_active: boolean;
  bill_payments: {
    id: string;
    billing_month: string;
    amount: number;
    paid_at: string;
  }[];
};

export type DashboardBillsData = {
  activeBills: {
    id: string;
    name: string;
    due_day: number | null;
    is_active: boolean;
    bill_payments: { id: string; billing_month: string }[];
  }[];
  paidPayments: {
    id: string;
    bill_id: string;
    billing_month: string;
    bill: { id: string; name: string; is_active: boolean } | null;
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
    id: string;
    account_id: string;
    account: {
      name: string;
    } | null;
  } | null;
};
