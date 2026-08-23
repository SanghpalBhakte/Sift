-- =============================================================================
-- Sweep - 01 Reference Payment Methods Seed
-- Path: supabase/seeds/01-reference-payment-methods.sql
-- =============================================================================

INSERT INTO public.payment_methods (id, user_id, name, type, is_default)
VALUES
  ('20000000-0000-0000-0000-000000000001', null, 'Credit Card', 'credit_card', false),
  ('20000000-0000-0000-0000-000000000002', null, 'Debit Card', 'debit_card', false),
  ('20000000-0000-0000-0000-000000000003', null, 'Bank Account', 'bank_account', false),
  ('20000000-0000-0000-0000-000000000004', null, 'UPI', 'upi', false),
  ('20000000-0000-0000-0000-000000000005', null, 'PayPal', 'paypal', false),
  ('20000000-0000-0000-0000-000000000006', null, 'Apple Pay', 'apple_pay', false),
  ('20000000-0000-0000-0000-000000000007', null, 'Google Pay', 'google_pay', false),
  ('20000000-0000-0000-0000-000000000008', null, 'Cash', 'cash', false),
  ('20000000-0000-0000-0000-000000000009', null, 'Other', 'other', false)
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  type = excluded.type;
