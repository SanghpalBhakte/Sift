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
        Relationships: [];
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
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          amount: number;
          currency: string;
          billing_cycle: "monthly" | "yearly";
          custom_interval_days: number | null;
          status: "active" | "paused" | "canceled" | "archived";
          category_id: string | null;
          payment_method_id: string | null;
          start_date: string;
          next_renewal_date: string;
          is_trial: boolean;
          trial_end_date: string | null;
          reminder_offsets: number[];
          value_rating: "essential" | "useful" | "rarely_used" | "cancel_candidate";
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
          billing_cycle: "monthly" | "yearly";
          custom_interval_days?: number | null;
          status?: "active" | "paused" | "canceled" | "archived";
          category_id?: string | null;
          payment_method_id?: string | null;
          start_date?: string;
          next_renewal_date: string;
          is_trial?: boolean;
          trial_end_date?: string | null;
          reminder_offsets?: number[];
          value_rating?: "essential" | "useful" | "rarely_used" | "cancel_candidate";
          cancel_url?: string | null;
          notes?: string | null;
          monthly_amount?: number;
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
          billing_cycle?: "monthly" | "yearly";
          custom_interval_days?: number | null;
          status?: "active" | "paused" | "canceled" | "archived";
          category_id?: string | null;
          payment_method_id?: string | null;
          start_date?: string;
          next_renewal_date?: string;
          is_trial?: boolean;
          trial_end_date?: string | null;
          reminder_offsets?: number[];
          value_rating?: "essential" | "useful" | "rarely_used" | "cancel_candidate";
          cancel_url?: string | null;
          notes?: string | null;
          monthly_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
