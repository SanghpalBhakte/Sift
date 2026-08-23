-- =============================================================================
-- Migration: Add Subscription Metadata Columns, Indexes and System Payment Methods
-- Path: supabase/migrations/20240106000000_subscription_metadata.sql
-- =============================================================================

-- 1. Add missing metadata columns to public.subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS previous_amount NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS price_hike_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_effective_date DATE;

-- 2. Allow system payment methods (nullable user_id) and expand check constraint
ALTER TABLE public.payment_methods ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_type_check;
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_type_check
CHECK (type IN ('credit_card', 'debit_card', 'bank_account', 'upi', 'paypal', 'apple_pay', 'google_pay', 'cash', 'other'));

-- 3. Unique index for reference/system rows to prevent duplication
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_system_idx ON public.categories (slug) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_type_system_idx ON public.payment_methods (type) WHERE user_id IS NULL;

-- 4. Update payment_methods RLS to allow viewing system payment methods
DROP POLICY IF EXISTS "Users can view own and system payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can manage own payment methods" ON public.payment_methods;

CREATE POLICY "Users can view own and system payment methods"
  ON public.payment_methods FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods"
  ON public.payment_methods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Seed Canonical System Categories (Idempotent by deterministic UUID)
INSERT INTO public.categories (id, user_id, name, slug, color, icon)
VALUES
  ('10000000-0000-0000-0000-000000000001', null, 'Software & Development', 'software-dev', 'moss', 'terminal'),
  ('10000000-0000-0000-0000-000000000002', null, 'Infrastructure & Cloud', 'infra-cloud', 'slate', 'server'),
  ('10000000-0000-0000-0000-000000000003', null, 'Productivity & Notes', 'productivity', 'ochre', 'edit-3'),
  ('10000000-0000-0000-0000-000000000004', null, 'Media & Reading', 'media-reading', 'terracotta', 'book-open'),
  ('10000000-0000-0000-0000-000000000005', null, 'Health & Routine', 'health-routine', 'sage', 'heart'),
  ('10000000-0000-0000-0000-000000000006', null, 'Utilities & Sync', 'utilities-sync', 'stone', 'home'),
  ('10000000-0000-0000-0000-000000000007', null, 'Education & Learning', 'education-learning', 'indigo', 'graduation-cap'),
  ('10000000-0000-0000-0000-000000000008', null, 'Finance & Money', 'finance-money', 'emerald', 'dollar-sign'),
  ('10000000-0000-0000-0000-000000000009', null, 'Food & Delivery', 'food-delivery', 'amber', 'utensils'),
  ('10000000-0000-0000-0000-000000000010', null, 'Shopping & Commerce', 'shopping-commerce', 'rose', 'shopping-bag'),
  ('10000000-0000-0000-0000-000000000011', null, 'Travel & Transport', 'travel-transport', 'sky', 'plane'),
  ('10000000-0000-0000-0000-000000000012', null, 'Entertainment & Games', 'entertainment-games', 'violet', 'gamepad-2'),
  ('10000000-0000-0000-0000-000000000013', null, 'Family & Home', 'family-home', 'teal', 'users'),
  ('10000000-0000-0000-0000-000000000014', null, 'Other', 'other', 'stone', 'folder')
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  slug = excluded.slug,
  color = excluded.color,
  icon = excluded.icon;

-- 6. Seed Canonical System Payment Methods (Idempotent by deterministic UUID)
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

-- 7. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
