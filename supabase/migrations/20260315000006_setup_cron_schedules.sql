-- Enable pg_cron (job scheduler) and pg_net (async HTTP from SQL).
-- Both are available on Supabase free tier.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ──────────────────────────────────────────────────────────────
-- Helper: invoke an Edge Function by name using Vault secrets.
--
-- Reads 'supabase_url' and 'service_role_key' from vault.
-- If secrets are not set (e.g. local dev), the call is skipped.
--
-- PRODUCTION SETUP (one-time, via Supabase Dashboard > Vault):
--   SELECT vault.create_secret('https://<ref>.supabase.co', 'supabase_url');
--   SELECT vault.create_secret('<service-role-key>', 'service_role_key');
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.invoke_edge_function(function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url text;
  svc_key  text;
BEGIN
  SELECT decrypted_secret INTO base_url
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_url'
    LIMIT 1;

  SELECT decrypted_secret INTO svc_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

  IF base_url IS NULL OR svc_key IS NULL THEN
    RAISE NOTICE 'invoke_edge_function(%): vault secrets not configured, skipping', function_name;
    RETURN;
  END IF;

  PERFORM net.http_post(
    url    := base_url || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body   := '{}'::jsonb
  );
END;
$$;

-- Restrict access — only postgres (cron jobs run as postgres)
REVOKE ALL ON FUNCTION public.invoke_edge_function(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_edge_function(text) TO postgres;

-- ──────────────────────────────────────────────────────────────
-- Schedule: YourSuper refresh — quarterly, 2nd of Jan/Apr/Jul/Oct at 03:00 UTC
-- Runs after quarter-end to allow ATO data to publish.
-- ──────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'yoursuper-refresh-quarterly',
  '0 3 2 1,4,7,10 *',
  $$ SELECT public.invoke_edge_function('yoursuper-refresh'); $$
);

-- ──────────────────────────────────────────────────────────────
-- Schedule: BTC price refresh — monthly, 16th at 04:00 UTC
-- Picks up the 15th close price once markets settle.
-- ──────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'btc-price-refresh-monthly',
  '0 4 16 * *',
  $$ SELECT public.invoke_edge_function('btc-price-refresh'); $$
);
