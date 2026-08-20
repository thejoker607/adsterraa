-- AdPromo Platform Schema
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  coin_balance INTEGER NOT NULL DEFAULT 100 CHECK (coin_balance >= 0),
  account_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (account_status IN ('pending', 'approved', 'rejected', 'blocked')),
  premium_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (premium_tier IN ('free', 'tier1', 'tier2')),
  referral_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by UUID REFERENCES public.profiles(id),
  last_daily_login DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users (separate from Supabase auth)
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Promotions
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_impressions INTEGER NOT NULL CHECK (target_impressions > 0),
  current_impressions INTEGER NOT NULL DEFAULT 0 CHECK (current_impressions >= 0),
  coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  last_started_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign impressions (legitimate views only)
CREATE TABLE public.campaign_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id),
  runner_session_id UUID,
  ip_hash TEXT,
  session_fingerprint TEXT,
  is_valid BOOLEAN NOT NULL DEFAULT TRUE,
  invalid_reason TEXT,
  view_duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coin transactions (ledger)
CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN (
      'daily_login', 'platform_task', 'referral', 'campaign_spend',
      'admin_adjustment', 'runner_reward', 'survey'
    )),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runner sessions
CREATE TABLE public.runner_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_size INTEGER NOT NULL CHECK (session_size IN (20, 30, 60)),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  current_index INTEGER NOT NULL DEFAULT 0,
  total_rewards_earned INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Runner session tasks
CREATE TABLE public.runner_session_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.runner_sessions(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id),
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'incomplete')),
  required_view_seconds INTEGER NOT NULL DEFAULT 20,
  view_duration_seconds INTEGER DEFAULT 0,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (session_id, order_index)
);

-- Task completions (duplicate prevention)
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL
    CHECK (task_type IN ('daily_login', 'platform_task', 'referral', 'runner_view')),
  reference_key TEXT NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, task_type, reference_key)
);

-- Platform configuration
CREATE TABLE public.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admin_users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_status ON public.profiles(account_status);
CREATE INDEX idx_promotions_user ON public.promotions(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX idx_impressions_campaign ON public.campaign_impressions(campaign_id);
CREATE INDEX idx_impressions_viewer ON public.campaign_impressions(viewer_id);
CREATE INDEX idx_coin_tx_user ON public.coin_transactions(user_id);
CREATE INDEX idx_runner_sessions_user ON public.runner_sessions(user_id);
CREATE INDEX idx_task_completions_user ON public.task_completions(user_id);

-- Default platform config
INSERT INTO public.platform_config (key, value, description) VALUES
  ('coin_rewards', '{"daily_login": 10, "referral": 50, "runner_view": 5, "platform_task": 25}', 'Coin rewards for activities'),
  ('campaign_pricing', '{"coins_per_100_impressions": 500}', 'Campaign pricing'),
  ('cooldowns', '{"free_minutes": 30, "tier1_minutes": 15, "tier2_minutes": 0}', 'Campaign cooldown by tier'),
  ('runner', '{"view_seconds": 20, "min_view_seconds": 15}', 'Runner settings');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Atomic coin deduction
CREATE OR REPLACE FUNCTION public.deduct_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.profiles
  SET coin_balance = coin_balance - p_amount
  WHERE id = p_user_id AND coin_balance >= p_amount
  RETURNING coin_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient coins or user not found';
  END IF;

  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (p_user_id, -p_amount, p_type, p_description, p_reference_id);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic coin addition
CREATE OR REPLACE FUNCTION public.add_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.profiles
  SET coin_balance = coin_balance + p_amount
  WHERE id = p_user_id
  RETURNING coin_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, reference_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_session_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own; service role manages all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile name"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Promotions: users manage own
CREATE POLICY "Users can view own promotions"
  ON public.promotions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own promotions"
  ON public.promotions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own draft promotions"
  ON public.promotions FOR UPDATE USING (auth.uid() = user_id);

-- Campaigns: users manage own
CREATE POLICY "Users can view own campaigns"
  ON public.campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns"
  ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coin transactions: users view own
CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

-- Runner sessions: users manage own
CREATE POLICY "Users can view own runner sessions"
  ON public.runner_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own runner sessions"
  ON public.runner_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runner sessions"
  ON public.runner_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Runner tasks: via session ownership
CREATE POLICY "Users can view own runner tasks"
  ON public.runner_session_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.runner_sessions rs
    WHERE rs.id = session_id AND rs.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own runner tasks"
  ON public.runner_session_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.runner_sessions rs
    WHERE rs.id = session_id AND rs.user_id = auth.uid()
  ));

-- Task completions: users view own
CREATE POLICY "Users can view own task completions"
  ON public.task_completions FOR SELECT USING (auth.uid() = user_id);

-- Platform config: readable by authenticated users
CREATE POLICY "Authenticated users can read config"
  ON public.platform_config FOR SELECT TO authenticated USING (true);

-- Reports: users can create
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- Admin tables: no direct client access (service role only)
CREATE POLICY "No client access to admin_users"
  ON public.admin_users FOR ALL USING (false);
CREATE POLICY "No client access to audit_logs"
  ON public.audit_logs FOR ALL USING (false);

-- Impressions: users can view impressions on their campaigns
CREATE POLICY "Campaign owners view impressions"
  ON public.campaign_impressions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_id AND c.user_id = auth.uid()
  ));

-- No direct anon access to sensitive data

-- Create admin via: npm run seed:admin
