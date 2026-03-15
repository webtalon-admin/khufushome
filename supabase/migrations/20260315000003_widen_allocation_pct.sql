-- Widen allocation percentage columns to prevent overflow from APRA SAA data
-- where summed sub-sector allocations can exceed the numeric(5,2) limit.
ALTER TABLE public.super_fund_allocations
  ALTER COLUMN australian_equities TYPE numeric(7,2),
  ALTER COLUMN international_equities TYPE numeric(7,2),
  ALTER COLUMN property TYPE numeric(7,2),
  ALTER COLUMN infrastructure TYPE numeric(7,2),
  ALTER COLUMN private_equity TYPE numeric(7,2),
  ALTER COLUMN alternatives TYPE numeric(7,2),
  ALTER COLUMN fixed_income TYPE numeric(7,2),
  ALTER COLUMN cash TYPE numeric(7,2);
