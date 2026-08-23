-- =============================================================================
-- Sweep - 00 Reference Categories Seed
-- Path: supabase/seeds/00-reference-categories.sql
-- =============================================================================

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
