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
