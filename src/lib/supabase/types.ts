export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          currency_preference: string;
          theme_preference: string;
          default_reminder_days: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          currency_preference?: string;
          theme_preference?: string;
          default_reminder_days?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          currency_preference?: string;
          theme_preference?: string;
          default_reminder_days?: number[];
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          slug: string;
          color: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          slug: string;
          color?: string;
          icon?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          slug?: string;
          color?: string;
          icon?: string;
          created_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          last4: string | null;
          color: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          last4?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          last4?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          amount: number;
          currency: string;
          billing_cycle: string;
          custom_interval_days: number | null;
          status: string;
          category_id: string | null;
          payment_method_id: string | null;
          start_date: string;
          next_renewal_date: string;
          is_trial: boolean;
          trial_end_date: string | null;
          reminder_offsets: number[];
          value_rating: string;
          cancel_url: string | null;
          notes: string | null;
          monthly_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          amount: number;
          currency?: string;
          billing_cycle: string;
          custom_interval_days?: number | null;
          status?: string;
          category_id?: string | null;
          payment_method_id?: string | null;
          start_date?: string;
          next_renewal_date: string;
          is_trial?: boolean;
          trial_end_date?: string | null;
          reminder_offsets?: number[];
          value_rating?: string;
          cancel_url?: string | null;
          notes?: string | null;
          monthly_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          amount?: number;
          currency?: string;
          billing_cycle?: string;
          custom_interval_days?: number | null;
          status?: string;
          category_id?: string | null;
          payment_method_id?: string | null;
          start_date?: string;
          next_renewal_date?: string;
          is_trial?: boolean;
          trial_end_date?: string | null;
          reminder_offsets?: number[];
          value_rating?: string;
          cancel_url?: string | null;
          notes?: string | null;
          monthly_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          reminder_date: string;
          offset_days: number;
          type: string;
          is_dismissed: boolean;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          reminder_date: string;
          offset_days: number;
          type: string;
          is_dismissed?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          reminder_date?: string;
          offset_days?: number;
          type?: string;
          is_dismissed?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
      };
      subscription_events: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          event_type: string;
          previous_amount: number | null;
          new_amount: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          event_type: string;
          previous_amount?: number | null;
          new_amount?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          event_type?: string;
          previous_amount?: number | null;
          new_amount?: number | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
  };
}
