-- Seed data for local development.
-- Run with: supabase db reset  (applies migrations then seeds)
--
-- Creates a test user via Supabase Auth helpers and inserts a
-- matching profile row. The test user can sign in with:
--   email:    dev@khufushome.local
--   password: password123

-- Use Supabase's auth helper to create a confirmed test user.
-- The on_auth_user_created trigger will auto-create the profile row,
-- but we override it below with richer seed data.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'authenticated',
  'authenticated',
  'dev@khufushome.local',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Dev User", "avatar_url": ""}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
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
  'email',
  now(),
  now(),
  now()
);

-- Override the trigger-created profile with richer seed data.
update public.profiles
set
  full_name = 'Dev User',
  role      = 'owner'
where id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
