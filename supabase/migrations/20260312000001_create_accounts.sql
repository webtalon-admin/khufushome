-- Finance: accounts table
-- Central table for all financial accounts (bank, super, crypto, investment, loan, etc.)

create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text not null check (type in (
    'checking', 'savings', 'credit_card', 'investment',
    'crypto_exchange', 'super', 'offset', 'loan'
  )),
  institution text,
  currency text default 'AUD',
  is_active boolean default true,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.accounts is 'Financial accounts: bank, super, crypto, investment, loan, etc.';
comment on column public.accounts.metadata is 'Type-specific fields (e.g., BSB/account for bank, fund_name/member_number for super).';

create index idx_accounts_user on public.accounts(user_id);

alter table public.accounts enable row level security;

create policy "Users can read own accounts"
  on public.accounts for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own accounts"
  on public.accounts for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own accounts"
  on public.accounts for delete
  using (user_id = (select auth.uid()));

-- Reuse the set_updated_at trigger function from the profiles migration
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();
