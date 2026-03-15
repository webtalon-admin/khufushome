-- Seed data for local development.
-- Run with: supabase db reset  (applies migrations then seeds)
--
-- Creates two test users:
--   admin  -> dev@khufushome.local  / Password1
--   member -> member@khufushome.local / Password1

-- ──────────────────────────────────────────────
-- 1. Admin user (you)
-- ──────────────────────────────────────────────

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'authenticated', 'authenticated',
  'dev@khufushome.local',
  crypt('Password1', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Dev Admin"}',
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'dev@khufushome.local',
  jsonb_build_object(
    'sub', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'email', 'dev@khufushome.local',
    'email_verified', true,
    'phone_verified', false
  ),
  'email', now(), now(), now()
);

update public.profiles set
  full_name = 'Dev Admin',
  role      = 'admin'
where id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

-- ──────────────────────────────────────────────
-- 2. Member user (partner)
-- ──────────────────────────────────────────────

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  'authenticated', 'authenticated',
  'member@khufushome.local',
  crypt('Password1', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Dev Member"}',
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  'member@khufushome.local',
  jsonb_build_object(
    'sub', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'email', 'member@khufushome.local',
    'email_verified', true,
    'phone_verified', false
  ),
  'email', now(), now(), now()
);

update public.profiles set
  full_name = 'Dev Member',
  role      = 'member'
where id = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

-- ──────────────────────────────────────────────
-- 3. Super account + quarterly balance snapshots
-- ──────────────────────────────────────────────
-- Create a super account for the admin user (Future Super)
insert into public.accounts (id, user_id, name, type, institution, metadata) values (
  '00000000-0000-0000-0000-000000000001',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'Future Super – Sustainable Growth',
  'super',
  'Future Super',
  '{"fund_id": "future_super", "member_number": "000000"}'
);

-- Quarterly balance snapshots from research data (Oct 2020 – Mar 2025).
-- Annual balances from config/personal.yaml, interpolated to quarter ends.
-- Transactions estimated from salary, SG rates, and Future Super fee schedule.
-- Quarters: Sep 30, Dec 31, Mar 31, Jun 30
-- SG rates: FY20-21 9.5%, FY21-22 10%, FY22-23 10.5%, FY23-24 11%, FY24-25 11.5%
insert into public.super_balance_history
  (super_account_id, user_id, balance, recorded_date,
   employer_contribution, salary_sacrifice, member_fee, income_tax, insurance_premium, investment_return)
values
  -- Starting anchor — opening balance, no transactions
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   51653.00, '2020-09-30', null, null, null, null, null, null),

  -- FY2020-21 (SG 9.5%, salary $120k → qtr employer = $2,850)
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   56001.00, '2020-12-31', 2850.00, null, 63.00, 427.50, null, 1988.50),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   60255.00, '2021-03-31', 2850.00, null, 67.23, 427.50, null, 1898.73),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   64556.00, '2021-06-30', 2850.00, null, 71.37, 427.50, null, 1949.87),

  -- FY2021-22 (SG 10%, salary $120k → qtr employer = $3,000)
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   68904.00, '2021-09-30', 3000.00, null, 75.31, 450.00, null, 1873.31),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   66644.00, '2021-12-31', 3000.00, null, 76.50, 450.00, null, -4733.50),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   64433.00, '2022-03-31', 3000.00, null, 73.95, 450.00, null, -4686.05),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   62198.00, '2022-06-30', 3000.00, null, 71.48, 450.00, null, -4713.52),

  -- FY2022-23 (SG 10.5%, salary $120k → qtr employer = $3,150)
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   59938.00, '2022-09-30', 3150.00, null, 69.72, 472.50, null, -4867.22),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   64062.00, '2022-12-31', 3150.00, null, 70.62, 472.50, null, 1517.12),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   68096.00, '2023-03-31', 3150.00, null, 74.07, 472.50, null, 1430.57),

  -- FY2022-23 Q4 (SG 10.5%, salary changes to $130k mid-year → qtr employer = $3,412.50)
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   72175.00, '2023-06-30', 3412.50, null, 77.62, 511.88, null, 1256.99),

  -- FY2023-24 (SG 11%, salary $130k → qtr employer = $3,575)
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   76299.00, '2023-09-30', 3575.00, null, 82.41, 536.25, null, 1167.66),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   81550.00, '2023-12-31', 3575.00, null, 86.11, 536.25, null, 2298.36),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   86744.00, '2024-03-31', 3575.00, null, 90.83, 536.25, null, 2245.08),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   91938.00, '2024-06-30', 3575.00, null, 95.37, 536.25, null, 2250.62),

  -- FY2024-25 (SG 11.5%, salary $130k → qtr employer = $3,737.50)
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   97189.00, '2024-09-30', 3737.50, null, 100.41, 560.63, null, 2174.54),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   103145.00, '2024-12-31', 3737.50, null, 105.15, 560.63, null, 2885.27),
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   108972.00, '2025-03-31', 3737.50, null, 109.69, 560.63, null, 2759.81),

  -- Q2 FY2024-25 (Apr–Jun 2025) — ACTUAL transactions from super account
  -- Note: April transactions missing from raw data; only May 31 + June included.
  -- Balance interpolated from Mar 2025 ($108,972) and Sep 2025 ($120,820).
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   114863.63, '2025-06-30', 1495.52, null, 46.89, 217.29, null, 4660.29),

  -- Q3 FY2025-26 (Jul–Sep 2025) — ACTUAL transactions, balance from personal.yaml
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   120820.00, '2025-09-30', 4823.85, null, 121.76, 705.30, null, 1959.58),

  -- Q4 FY2025-26 (Oct–Dec 2025) — ACTUAL transactions, balance interpolated
  -- from Sep 2025 ($120,820) and Mar 2026 ($119,000).
  ('00000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
   119805.21, '2025-12-31', 4823.85, null, 126.78, 704.54, null, -5007.32)
;
