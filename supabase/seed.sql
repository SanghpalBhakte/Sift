-- =============================================================================
-- Sift - System Categories & Seed Data
-- =============================================================================

-- Seed system categories (available to all users)
insert into public.categories (id, user_id, name, slug, color, icon)
values
  ('10000000-0000-0000-0000-000000000001', null, 'Software & Dev', 'software-dev', 'moss', 'terminal'),
  ('10000000-0000-0000-0000-000000000002', null, 'Infrastructure & Cloud', 'infra-cloud', 'slate', 'server'),
  ('10000000-0000-0000-0000-000000000003', null, 'Productivity & Writing', 'productivity', 'ochre', 'edit-3'),
  ('10000000-0000-0000-0000-000000000004', null, 'Media & Reading', 'media-reading', 'terracotta', 'book-open'),
  ('10000000-0000-0000-0000-000000000005', null, 'Health & Wellbeing', 'health-wellbeing', 'sage', 'heart'),
  ('10000000-0000-0000-0000-000000000006', null, 'Utilities & Home', 'utilities-home', 'stone', 'home')
on conflict (id) do nothing;
