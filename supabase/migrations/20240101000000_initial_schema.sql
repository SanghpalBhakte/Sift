-- =============================================================================
-- Sift - Subscription & Recurring Payments Database Schema
-- Migration: 20240101000000_initial_schema.sql (Idempotent)
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Profiles Table
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  currency_preference text not null default 'USD',
  theme_preference text not null default 'paper-ledger',
  default_reminder_days integer[] not null default '{3, 1}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- -----------------------------------------------------------------------------
-- 2. Categories Table
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  color text not null default 'moss',
  icon text not null default 'folder',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- -----------------------------------------------------------------------------
-- 3. Payment Methods Table
-- -----------------------------------------------------------------------------
create table if not exists public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit_card', 'debit_card', 'bank_account', 'paypal', 'apple_pay', 'other')),
  last4 text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

-- -----------------------------------------------------------------------------
-- 4. Subscriptions Table
-- -----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  billing_cycle text not null check (billing_cycle in ('monthly', 'quarterly', 'yearly', 'custom')),
  custom_interval_days integer check (billing_cycle != 'custom' or custom_interval_days > 0),
  status text not null default 'active' check (status in ('active', 'paused', 'canceled', 'archived')),
  category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  start_date date not null default current_date,
  next_renewal_date date not null,
  is_trial boolean not null default false,
  trial_end_date date,
  reminder_offsets integer[] not null default '{3, 1}',
  value_rating text not null default 'useful' check (value_rating in ('essential', 'useful', 'rarely_used', 'cancel_candidate')),
  cancel_url text,
  notes text,
  monthly_amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- -----------------------------------------------------------------------------
-- 5. Reminders Table
-- -----------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  reminder_date date not null,
  offset_days integer not null,
  type text not null check (type in ('renewal', 'trial_expiry')),
  is_dismissed boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.reminders enable row level security;

-- -----------------------------------------------------------------------------
-- 6. Subscription Events Table (Audit / Spend History)
-- -----------------------------------------------------------------------------
create table if not exists public.subscription_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'renewed', 'price_changed', 'cycle_changed', 'status_changed', 'trial_converted', 'canceled')),
  previous_amount numeric(12, 2),
  new_amount numeric(12, 2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.subscription_events enable row level security;

-- -----------------------------------------------------------------------------
-- Performance Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(user_id, status);
create index if not exists idx_subscriptions_renewal on public.subscriptions(user_id, next_renewal_date);
create index if not exists idx_subscriptions_category on public.subscriptions(user_id, category_id);
create index if not exists idx_reminders_user_date on public.reminders(user_id, reminder_date) where not is_dismissed;
create index if not exists idx_subscription_events_sub on public.subscription_events(subscription_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS) Policies (Idempotent with DROP IF EXISTS)
-- -----------------------------------------------------------------------------

-- Profiles RLS
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Categories RLS
drop policy if exists "Users can view own and system categories" on public.categories;
create policy "Users can view own and system categories"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

drop policy if exists "Users can insert custom categories" on public.categories;
create policy "Users can insert custom categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own custom categories" on public.categories;
create policy "Users can update own custom categories"
  on public.categories for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own custom categories" on public.categories;
create policy "Users can delete own custom categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Payment Methods RLS
drop policy if exists "Users can view own payment methods" on public.payment_methods;
create policy "Users can view own payment methods"
  on public.payment_methods for select
  using (auth.uid() = user_id);

drop policy if exists "Users can manage own payment methods" on public.payment_methods;
create policy "Users can manage own payment methods"
  on public.payment_methods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Subscriptions RLS
drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can manage own subscriptions" on public.subscriptions;
create policy "Users can manage own subscriptions"
  on public.subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reminders RLS
drop policy if exists "Users can view and manage own reminders" on public.reminders;
create policy "Users can view and manage own reminders"
  on public.reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Subscription Events RLS
drop policy if exists "Users can view own subscription events" on public.subscription_events;
create policy "Users can view own subscription events"
  on public.subscription_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own subscription events" on public.subscription_events;
create policy "Users can insert own subscription events"
  on public.subscription_events for insert
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Helper Functions & Triggers
-- -----------------------------------------------------------------------------

-- Auto-create profile trigger on auth.users sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition for new auth user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Automatic updated_at timestamp function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- System Categories Seed
-- -----------------------------------------------------------------------------
insert into public.categories (id, user_id, name, slug, color, icon)
values
  ('10000000-0000-0000-0000-000000000001', null, 'Software & Dev', 'software-dev', 'moss', 'terminal'),
  ('10000000-0000-0000-0000-000000000002', null, 'Infrastructure & Cloud', 'infra-cloud', 'slate', 'server'),
  ('10000000-0000-0000-0000-000000000003', null, 'Productivity & Notes', 'productivity', 'ochre', 'edit-3'),
  ('10000000-0000-0000-0000-000000000004', null, 'Media & Reading', 'media-reading', 'terracotta', 'book-open'),
  ('10000000-0000-0000-0000-000000000005', null, 'Health & Routine', 'health-routine', 'sage', 'heart'),
  ('10000000-0000-0000-0000-000000000006', null, 'Utilities & Sync', 'utilities-sync', 'stone', 'home')
on conflict (id) do nothing;
