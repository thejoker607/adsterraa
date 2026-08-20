export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountStatus = "pending" | "approved" | "rejected" | "blocked";
export type PremiumTier = "free" | "tier1" | "tier2";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  coin_balance: number;
  account_status: AccountStatus;
  premium_tier: PremiumTier;
  referral_code: string;
  referred_by: string | null;
  last_daily_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Promotion {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  promotion_id: string;
  user_id: string;
  target_impressions: number;
  current_impressions: number;
  coin_cost: number;
  status: string;
  last_started_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface RunnerSession {
  id: string;
  user_id: string;
  session_size: number;
  status: string;
  current_index: number;
  total_rewards_earned: number;
  started_at: string;
  last_heartbeat_at: string;
  completed_at: string | null;
}

export interface RunnerSessionTask {
  id: string;
  session_id: string;
  campaign_id: string;
  promotion_id: string;
  order_index: number;
  status: string;
  required_view_seconds: number;
  view_duration_seconds: number | null;
  reward_coins: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface PlatformConfig {
  coin_rewards: {
    daily_login: number;
    referral: number;
    runner_view: number;
    platform_task: number;
  };
  campaign_pricing: {
    coins_per_100_impressions: number;
  };
  cooldowns: {
    free_minutes: number;
    tier1_minutes: number;
    tier2_minutes: number;
  };
  runner: {
    view_seconds: number;
    min_view_seconds: number;
  };
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          coin_balance?: number;
          account_status?: AccountStatus;
          premium_tier?: PremiumTier;
          referral_code?: string;
          referred_by?: string | null;
          last_daily_login?: string | null;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUser;
        Insert: {
          email: string;
          password_hash: string;
          name: string;
          is_active?: boolean;
        };
        Update: Partial<AdminUser>;
        Relationships: [];
      };
      promotions: {
        Row: Promotion;
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          url: string;
          status?: string;
        };
        Update: Partial<Promotion>;
        Relationships: [];
      };
      campaigns: {
        Row: Campaign;
        Insert: {
          promotion_id: string;
          user_id: string;
          target_impressions: number;
          coin_cost: number;
          status?: string;
          current_impressions?: number;
          last_started_at?: string | null;
          admin_notes?: string | null;
        };
        Update: Partial<Campaign>;
        Relationships: [];
      };
      campaign_impressions: {
        Row: {
          id: string;
          campaign_id: string;
          viewer_id: string | null;
          runner_session_id: string | null;
          ip_hash: string | null;
          session_fingerprint: string | null;
          is_valid: boolean;
          invalid_reason: string | null;
          view_duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          campaign_id: string;
          viewer_id?: string | null;
          runner_session_id?: string | null;
          ip_hash?: string | null;
          session_fingerprint?: string | null;
          is_valid?: boolean;
          invalid_reason?: string | null;
          view_duration_seconds?: number | null;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      coin_transactions: {
        Row: CoinTransaction;
        Insert: {
          user_id: string;
          amount: number;
          transaction_type: string;
          reference_id?: string | null;
          description?: string | null;
        };
        Update: Partial<CoinTransaction>;
        Relationships: [];
      };
      runner_sessions: {
        Row: RunnerSession;
        Insert: {
          user_id: string;
          session_size: number;
          status?: string;
          current_index?: number;
          total_rewards_earned?: number;
        };
        Update: Partial<RunnerSession>;
        Relationships: [];
      };
      runner_session_tasks: {
        Row: RunnerSessionTask;
        Insert: {
          session_id: string;
          campaign_id: string;
          promotion_id: string;
          order_index: number;
          required_view_seconds: number;
          reward_coins: number;
          status?: string;
          started_at?: string | null;
          view_duration_seconds?: number | null;
        };
        Update: Partial<RunnerSessionTask>;
        Relationships: [];
      };
      task_completions: {
        Row: {
          id: string;
          user_id: string;
          task_type: string;
          reference_key: string;
          coins_earned: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          task_type: string;
          reference_key: string;
          coins_earned: number;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      platform_config: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
        };
        Update: {
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          admin_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          details?: Json | null;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          promotion_id: string;
          reason: string;
          status: string;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          promotion_id: string;
          reason: string;
          status?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      deduct_coins: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: string;
          p_description?: string;
          p_reference_id?: string;
        };
        Returns: number;
      };
      add_coins: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: string;
          p_description?: string;
          p_reference_id?: string;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
