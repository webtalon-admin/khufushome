-- Widen return_pct to accommodate quarterly returns with more decimal precision
-- and higher absolute values from APRA edge cases.
ALTER TABLE public.super_fund_returns
  ALTER COLUMN return_pct TYPE numeric(10,4);
