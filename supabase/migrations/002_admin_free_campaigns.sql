-- Allow admin-published campaigns with no coin cost
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_coin_cost_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_coin_cost_check CHECK (coin_cost >= 0);
