-- =========================================================
-- Masroufi
-- Migration: 013 - Bills and bill payments
-- Purpose:
--   Keep recurring obligations (DEWA, internet, mobile lines, etc.)
--   separate from subscriptions and everyday transactions.
-- =========================================================

DO $$
BEGIN
  CREATE TYPE public.bill_frequency AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  provider text,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  default_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  frequency public.bill_frequency NOT NULL DEFAULT 'monthly',
  due_day smallint CHECK (due_day BETWEEN 1 AND 31),
  expected_amount numeric(14, 2) CHECK (expected_amount IS NULL OR expected_amount >= 0),
  currency public.currency_code NOT NULL DEFAULT 'AED',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL UNIQUE REFERENCES public.transactions(id) ON DELETE CASCADE,
  billing_month date NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  paid_at date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bill_id, billing_month)
);

CREATE INDEX IF NOT EXISTS bills_user_active_idx
  ON public.bills(user_id, is_active);

CREATE INDEX IF NOT EXISTS bill_payments_user_month_idx
  ON public.bill_payments(user_id, billing_month DESC);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bills_own_all ON public.bills;
CREATE POLICY bills_own_all
  ON public.bills
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bill_payments_own_all ON public.bill_payments;
CREATE POLICY bill_payments_own_all
  ON public.bill_payments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT USAGE ON TYPE public.bill_frequency TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.bills, public.bill_payments
  TO authenticated;

DROP TRIGGER IF EXISTS bills_set_updated_at ON public.bills;
CREATE TRIGGER bills_set_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Utility-specific categories are represented by bill records now.
UPDATE public.categories
SET is_active = false
WHERE is_system = true
  AND name IN ('Electricity', 'Water', 'Internet', 'Mobile')
  AND transaction_type = 'expense'::public.transaction_type;

-- Create one generic Bills category per current user.
INSERT INTO public.categories (user_id, name, transaction_type, is_system)
SELECT DISTINCT
  c.user_id,
  'Bills',
  'expense'::public.transaction_type,
  true
FROM public.categories c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories existing
  WHERE existing.user_id = c.user_id
    AND lower(existing.name) = 'bills'
    AND existing.transaction_type = 'expense'::public.transaction_type
);

CREATE OR REPLACE FUNCTION public.pay_bill(
  p_bill_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_paid_at date,
  p_billing_month date,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_bill public.bills%rowtype;
  v_account public.accounts%rowtype;
  v_payee_id uuid;
  v_transaction_id uuid;
  v_payment_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO v_bill
  FROM public.bills
  WHERE id = p_bill_id
    AND user_id = v_user_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid bill';
  END IF;

  SELECT *
  INTO v_account
  FROM public.accounts
  WHERE id = p_account_id
    AND user_id = v_user_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid account';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  SELECT id
  INTO v_payee_id
  FROM public.payees
  WHERE user_id = v_user_id
    AND lower(name) = lower(coalesce(v_bill.provider, v_bill.name))
    AND is_active = true
  LIMIT 1;

  IF v_payee_id IS NULL THEN
    INSERT INTO public.payees (user_id, name, type)
    VALUES (v_user_id, coalesce(v_bill.provider, v_bill.name), 'company')
    RETURNING id INTO v_payee_id;
  END IF;

  INSERT INTO public.transactions (
    user_id,
    account_id,
    category_id,
    payee_id,
    type,
    amount,
    currency,
    transaction_date,
    notes
  )
  VALUES (
    v_user_id,
    p_account_id,
    v_bill.category_id,
    v_payee_id,
    'expense'::public.transaction_type,
    p_amount,
    v_account.currency,
    p_paid_at,
    coalesce(nullif(trim(p_notes), ''), v_bill.name || ' bill')
  )
  RETURNING id INTO v_transaction_id;

  INSERT INTO public.bill_payments (
    user_id,
    bill_id,
    transaction_id,
    billing_month,
    amount,
    paid_at,
    notes
  )
  VALUES (
    v_user_id,
    p_bill_id,
    v_transaction_id,
    date_trunc('month', p_billing_month)::date,
    p_amount,
    p_paid_at,
    nullif(trim(p_notes), '')
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

GRANT EXECUTE
  ON FUNCTION public.pay_bill(uuid, uuid, numeric, date, date, text)
  TO authenticated;

-- Starter categories for users who sign up after this migration.
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.categories (user_id, name, transaction_type, is_system)
  VALUES
    (current_user_id, 'Salary', 'income'::public.transaction_type, true),
    (current_user_id, 'Other income', 'income'::public.transaction_type, true),
    (current_user_id, 'Groceries', 'expense'::public.transaction_type, true),
    (current_user_id, 'Restaurants', 'expense'::public.transaction_type, true),
    (current_user_id, 'Fuel', 'expense'::public.transaction_type, true),
    (current_user_id, 'Car', 'expense'::public.transaction_type, true),
    (current_user_id, 'Rent', 'expense'::public.transaction_type, true),
    (current_user_id, 'Bills', 'expense'::public.transaction_type, true),
    (current_user_id, 'Home', 'expense'::public.transaction_type, true),
    (current_user_id, 'Entertainment', 'expense'::public.transaction_type, true),
    (current_user_id, 'Clothing', 'expense'::public.transaction_type, true),
    (current_user_id, 'Health', 'expense'::public.transaction_type, true),
    (current_user_id, 'Subscriptions', 'expense'::public.transaction_type, true),
    (current_user_id, 'Gifts', 'expense'::public.transaction_type, true),
    (current_user_id, 'Pets', 'expense'::public.transaction_type, true),
    (current_user_id, 'Other expense', 'expense'::public.transaction_type, true)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE
  ON FUNCTION public.create_default_categories()
  TO authenticated;
