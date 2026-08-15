-- =============================================================================
-- Migration: Add Monthly Alternative Price to Subscriptions for Annual Arbitrage
-- Path: supabase/migrations/20240105000000_annual_optimization.sql
-- =============================================================================

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS monthly_alternative_price NUMERIC(10, 2);
