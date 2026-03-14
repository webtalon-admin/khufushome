-- Finance: superannuation personal tracking tables
-- Contributions, balance snapshots, and fund switch history.
-- Super accounts use the accounts table with type='super'.

create table if not exists public.super_contributions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  super_account_id uuid references public.accounts not null,
  type text not null check (type in (
    'employer_sg', 'salary_sacrifice', 'personal_concessional',
    'personal_non_concessional', 'government_co_contribution'
  )),
  amount numeric(14,2) not null,
  date date not null,
  financial_year text not null,
  employer_name text,
  notes text,
  created_at timestamptz default now()
);

comment on table public.super_contributions is 'Superannuation contributions by type, linked to a super account.';
comment on column public.super_contributions.type is 'employer_sg (11.5%), salary_sacrifice, personal_concessional, personal_non_concessional, government_co_contribution';
comment on column public.super_contributions.financial_year is 'AU FY e.g. "2025-2026". Used for concessional cap tracking ($30k).';

create index idx_super_contributions_fy on public.super_contributions(user_id, financial_year);
create index idx_super_contributions_account on public.super_contributions(super_account_id);

alter table public.super_contributions enable row level security;

create policy "Users can read own super contributions"
  on public.super_contributions for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own super contributions"
  on public.super_contributions for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own super contributions"
  on public.super_contributions for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own super contributions"
  on public.super_contributions for delete
  using (user_id = (select auth.uid()));

-- Balance history snapshots (entered from quarterly statements)
create table if not exists public.super_balance_history (
  id uuid default gen_random_uuid() primary key,
  super_account_id uuid references public.accounts not null,
  user_id uuid references auth.users not null,
  balance numeric(14,2) not null,
  recorded_date date not null,
  created_at timestamptz default now()
);

comment on table public.super_balance_history is 'Periodic super balance snapshots from statements for growth tracking.';

create index idx_super_balance_account on public.super_balance_history(super_account_id, recorded_date);
create index idx_super_balance_user on public.super_balance_history(user_id);

alter table public.super_balance_history enable row level security;

create policy "Users can read own super balance history"
  on public.super_balance_history for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own super balance history"
  on public.super_balance_history for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own super balance history"
  on public.super_balance_history for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own super balance history"
  on public.super_balance_history for delete
  using (user_id = (select auth.uid()));

-- Fund switch events (e.g., Future Super → Hostplus)
create table if not exists public.super_fund_switches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  from_account_id uuid references public.accounts,
  to_account_id uuid references public.accounts not null,
  switch_date date not null,
  reason text,
  balance_at_switch numeric(14,2),
  created_at timestamptz default now()
);

comment on table public.super_fund_switches is 'Records when user changes super funds. Shown as markers on performance charts.';

create index idx_super_switches_user on public.super_fund_switches(user_id);

alter table public.super_fund_switches enable row level security;

create policy "Users can read own fund switches"
  on public.super_fund_switches for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own fund switches"
  on public.super_fund_switches for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own fund switches"
  on public.super_fund_switches for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own fund switches"
  on public.super_fund_switches for delete
  using (user_id = (select auth.uid()));
