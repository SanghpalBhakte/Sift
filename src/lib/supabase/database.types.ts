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
          color?: string;
          icon?: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          slug: string;
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          slug?: string;
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          slug?: string;
          type: string;
          last4?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          slug?: string;
          type: string;
          last4?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          slug?: string;
          type?: string;
          last4?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          notes: string | null;
          amount: number;
          currency: string;
          billing_cycle: "monthly" | "yearly";
          next_billing_date: string;
          category_id: string | null;
          payment_method_id: string | null;
          is_active: boolean;
          status: "active" | "paused" | "cancelled" | "trial";
          trial_ends_on: string | null;
          cancellation_effective_date: string | null;
          monthly_alternative_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          notes?: string | null;
          amount: number;
          currency?: string;
          billing_cycle: "monthly" | "yearly";
          next_billing_date: string;
          category_id?: string | null;
          payment_method_id?: string | null;
          is_active?: boolean;
          status?: "active" | "paused" | "cancelled" | "trial";
          trial_ends_on?: string | null;
          cancellation_effective_date?: string | null;
          monthly_alternative_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          notes?: string | null;
          amount?: number;
          currency?: string;
          billing_cycle?: "monthly" | "yearly";
          next_billing_date?: string;
          category_id?: string | null;
          payment_method_id?: string | null;
          is_active?: boolean;
          status?: "active" | "paused" | "cancelled" | "trial";
          trial_ends_on?: string | null;
          cancellation_effective_date?: string | null;
          monthly_alternative_price?: number | null;
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
