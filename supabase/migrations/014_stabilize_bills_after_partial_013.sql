-- =========================================================
-- Masroufi
-- Migration: 014 - Stabilize Bills migration
-- Purpose:
--   Safe recovery for databases where migration 013 was run partially.
--   This migration is idempotent and may be run after the corrected 013.
-- =========================================================

-- Ensure the Bills category exists without mixing text and enum types.
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

UPDATE public.categories
SET is_active = false
WHERE is_system = true
  AND name IN ('Electricity', 'Water', 'Internet', 'Mobile')
  AND transaction_type = 'expense'::public.transaction_type;

GRANT USAGE ON TYPE public.bill_frequency TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.bills, public.bill_payments
  TO authenticated;

GRANT EXECUTE
  ON FUNCTION public.pay_bill(uuid, uuid, numeric, date, date, text)
  TO authenticated;
