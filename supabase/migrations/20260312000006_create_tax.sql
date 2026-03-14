-- Finance: tax_years + income_sources tables
-- Australian tax estimation and income tracking.

create table if not exists public.tax_years (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  financial_year text not null,
  gross_salary numeric(14,2),
  tax_withheld numeric(14,2),
  other_income jsonb default '{}',
  deductions jsonb default '{}',
  cgt_events jsonb default '[]',
  medicare_levy numeric(14,2),
  estimated_tax numeric(14,2),
  estimated_refund numeric(14,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, financial_year)
);

comment on table public.tax_years is 'Per-FY tax summary (AU financial year July-June, e.g. "2025-2026").';
comment on column public.tax_years.other_income is '{ dividends, franking_credits, crypto_income, rental, interest, other }';
comment on column public.tax_years.deductions is '{ work_related: {...}, self_education, investment: {...}, donations, other }';
comment on column public.tax_years.cgt_events is 'Array of { asset, date_acquired, date_sold, cost_base, proceeds, gain_loss, held_over_12m, discount_applied }';

create index idx_tax_years_user on public.tax_years(user_id);

alter table public.tax_years enable row level security;

create policy "Users can read own tax years"
  on public.tax_years for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own tax years"
  on public.tax_years for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own tax years"
  on public.tax_years for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own tax years"
  on public.tax_years for delete
  using (user_id = (select auth.uid()));

create trigger tax_years_set_updated_at
  before update on public.tax_years
  for each row execute function public.set_updated_at();

-- Income sources
create table if not exists public.income_sources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text not null check (type in (
    'salary', 'dividend', 'crypto', 'rental', 'interest', 'freelance', 'other'
  )),
  amount numeric(14,2) not null,
  frequency text not null check (frequency in (
    'weekly', 'fortnightly', 'monthly', 'quarterly', 'annually', 'one_off'
  )),
  is_pre_tax boolean default true,
  tax_withheld numeric(14,2) default 0,
  start_date date,
  end_date date,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

comment on table public.income_sources is 'Income streams with frequency for tax and budget projections.';

create index idx_income_sources_user on public.income_sources(user_id);

alter table public.income_sources enable row level security;

create policy "Users can read own income sources"
  on public.income_sources for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own income sources"
  on public.income_sources for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own income sources"
  on public.income_sources for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own income sources"
  on public.income_sources for delete
  using (user_id = (select auth.uid()));
