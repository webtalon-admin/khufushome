-- Extend super_balance_history with quarterly statement transaction columns
-- and create btc_price_monthly reference table for SMSF BTC simulation.

-- 1A. Add transaction columns to super_balance_history
ALTER TABLE public.super_balance_history
  ADD COLUMN employer_contribution numeric(14,2),
  ADD COLUMN salary_sacrifice numeric(14,2),
  ADD COLUMN member_fee numeric(14,2),
  ADD COLUMN income_tax numeric(14,2),
  ADD COLUMN insurance_premium numeric(14,2),
  ADD COLUMN investment_return numeric(14,2);

COMMENT ON COLUMN public.super_balance_history.employer_contribution IS 'Employer SG contributions received during the quarter.';
COMMENT ON COLUMN public.super_balance_history.salary_sacrifice IS 'Voluntary salary sacrifice contributions during the quarter.';
COMMENT ON COLUMN public.super_balance_history.member_fee IS 'Administration/member fees charged during the quarter (positive = cost).';
COMMENT ON COLUMN public.super_balance_history.income_tax IS 'Tax on contributions/earnings. Positive = tax deducted, negative = tax refund.';
COMMENT ON COLUMN public.super_balance_history.insurance_premium IS 'Insurance premium deducted during the quarter.';
COMMENT ON COLUMN public.super_balance_history.investment_return IS 'Derived: balance change minus net contributions. Calculated on insert/update by the app.';

-- 1B. BTC monthly price reference table
CREATE TABLE IF NOT EXISTS public.btc_price_monthly (
  month date PRIMARY KEY,
  btc_aud_close numeric(12,2) NOT NULL,
  source text DEFAULT 'coingecko',
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.btc_price_monthly IS 'Monthly BTC/AUD close prices for SMSF Bitcoin what-if simulation.';

ALTER TABLE public.btc_price_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read BTC prices"
  ON public.btc_price_monthly FOR SELECT
  USING (auth.role() = 'authenticated');
