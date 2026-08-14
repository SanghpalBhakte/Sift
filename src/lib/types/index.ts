export type SubscriptionStatus = 'active' | 'paused' | 'canceled' | 'archived';

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type ValueRating = 'essential' | 'useful' | 'rarely_used' | 'cancel_candidate';

export type PaymentMethodType =
  | 'credit_card'
  | 'debit_card'
  | 'bank_account'
  | 'paypal'
  | 'apple_pay'
  | 'other';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  currency_preference: string;
  theme_preference: 'paper-ledger' | 'night-shelf' | 'system';
  default_reminder_days: number[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  slug: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  type: PaymentMethodType;
  last4?: string;
  color?: string;
  is_default: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  custom_interval_days?: number;
  status: SubscriptionStatus;
  category_id?: string | null;
  payment_method_id?: string | null;
  start_date: string; // ISO date string (YYYY-MM-DD)
  next_renewal_date: string; // ISO date string (YYYY-MM-DD)
  is_trial: boolean;
  trial_end_date?: string | null; // ISO date string (YYYY-MM-DD)
  reminder_offsets: number[]; // e.g. [7, 3, 1]
  value_rating: ValueRating;
  cancel_url?: string;
  notes?: string;
  monthly_amount: number; // normalized monthly amount
  created_at: string;
  updated_at: string;
  
  // Expanded relations (optional, when joined)
  category?: Category;
  payment_method?: PaymentMethod;
}

export interface Reminder {
  id: string;
  user_id: string;
  subscription_id: string;
  reminder_date: string;
  offset_days: number;
  type: 'renewal' | 'trial_expiry';
  is_dismissed: boolean;
  sent_at?: string | null;
  created_at: string;
  subscription?: Subscription;
}

export interface SubscriptionEvent {
  id: string;
  user_id: string;
  subscription_id: string;
  event_type:
    | 'created'
    | 'renewed'
    | 'price_changed'
    | 'cycle_changed'
    | 'status_changed'
    | 'trial_converted'
    | 'canceled';
  previous_amount?: number;
  new_amount?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  monthlyTotal: number;
  yearlyProjected: number;
  activeCount: number;
  pausedCount: number;
  trialCount: number;
  cancelCandidateCount: number;
  potentialMonthlySavings: number;
  upcomingRenewalsCount: number;
  nextUpcomingRenewal: Subscription | null;
}

export interface SubscriptionFilters {
  search?: string;
  status?: SubscriptionStatus | 'all';
  category_id?: string | 'all';
  value_rating?: ValueRating | 'all';
  billing_cycle?: BillingCycle | 'all';
  sortBy?: 'next_renewal_date' | 'amount' | 'name' | 'monthly_amount';
  sortOrder?: 'asc' | 'desc';
}

export type SubscriptionFormData = Omit<
  Subscription,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'monthly_amount' | 'category' | 'payment_method'
>;
