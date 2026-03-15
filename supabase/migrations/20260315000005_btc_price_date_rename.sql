-- Rename 'month' to 'price_date' to support arbitrary dates (1st, 15th, etc.)
ALTER TABLE public.btc_price_monthly RENAME COLUMN month TO price_date;

COMMENT ON TABLE public.btc_price_monthly IS 'BTC/AUD close prices for SMSF Bitcoin what-if simulation. Stores 1st and 15th of each month.';
