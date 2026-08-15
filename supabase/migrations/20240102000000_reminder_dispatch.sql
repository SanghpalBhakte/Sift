-- =============================================================================
-- Sift - Automated Reminder Dispatch & Notification Logging Migration
-- Migration: 20240102000000_reminder_dispatch.sql (Idempotent)
-- =============================================================================

-- 1. Ensure notification preferences exist on profiles
alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists notify_renewals boolean not null default true,
  add column if not exists notify_trials boolean not null default true;

-- -----------------------------------------------------------------------------
-- 2. Reminder Dispatch Logs Table (Audit, Deduplication & Delivery History)
-- -----------------------------------------------------------------------------
create table if not exists public.reminder_dispatch_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('renewal', 'trial_expiry')),
  target_date date not null,
  offset_days integer not null,
  delivery_channel text not null default 'email',
  recipient_email text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  external_id text, -- e.g. Resend message ID
  error_message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.reminder_dispatch_logs enable row level security;

-- -----------------------------------------------------------------------------
-- 3. Indexes & Deduplication Constraint
-- -----------------------------------------------------------------------------
create index if not exists idx_dispatch_user_id on public.reminder_dispatch_logs(user_id);
create index if not exists idx_dispatch_sub_date on public.reminder_dispatch_logs(subscription_id, target_date);

-- Unique index prevents sending the same reminder event + offset + target date more than once
create unique index if not exists idx_unique_dispatch_success
  on public.reminder_dispatch_logs (subscription_id, reminder_type, target_date, offset_days, delivery_channel)
  where status = 'sent';

-- -----------------------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
drop policy if exists "Users can view own dispatch logs" on public.reminder_dispatch_logs;
create policy "Users can view own dispatch logs"
  on public.reminder_dispatch_logs for select
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. pg_cron Scheduling Setup (Optional / Configurable via Supabase Dashboard)
-- -----------------------------------------------------------------------------
-- Enables pg_cron extension if available on project
create extension if not exists pg_cron;
create extension if not exists pg_net;
