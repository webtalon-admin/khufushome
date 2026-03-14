-- Finance: super fund reference data tables
-- Populated by the Super Data Pipeline (APRA CSV ingestion + ATO YourSuper API).
-- These are shared reference tables, not per-user data.

create table if not exists public.super_fund_reference (
  id text primary key,
  name text not null,
  option_name text not null,
  fund_type text not null,
  abn text,
  aum_billions numeric(10,2),
  members integer,
  return_target text,
  growth_defensive_split jsonb,
  website text,
  notes text,
  updated_at timestamptz default now()
);

comment on table public.super_fund_reference is 'Static metadata for tracked super funds. Populated by pipeline from APRA data.';

create trigger super_fund_reference_set_updated_at
  before update on public.super_fund_reference
  for each row execute function public.set_updated_at();

-- Fund annual returns
create table if not exists public.super_fund_returns (
  id uuid default gen_random_uuid() primary key,
  fund_id text references public.super_fund_reference not null,
  fy text not null,
  return_pct numeric(6,2) not null,
  return_type text not null,
  source text,
  unique(fund_id, fy)
);

comment on table public.super_fund_returns is 'Annual return percentages per fund. Auto-refreshed from APRA Historical Performance CSV.';

create index idx_super_returns_fund on public.super_fund_returns(fund_id);

-- Fund asset allocations
create table if not exists public.super_fund_allocations (
  id uuid default gen_random_uuid() primary key,
  fund_id text references public.super_fund_reference not null,
  australian_equities numeric(5,2),
  international_equities numeric(5,2),
  property numeric(5,2),
  infrastructure numeric(5,2),
  private_equity numeric(5,2),
  alternatives numeric(5,2),
  fixed_income numeric(5,2),
  cash numeric(5,2),
  source text,
  updated_at timestamptz default now(),
  unique(fund_id)
);

comment on table public.super_fund_allocations is 'Strategic asset allocation breakdown per fund. Auto-refreshed from APRA Historical SAA CSV.';

create trigger super_fund_allocations_set_updated_at
  before update on public.super_fund_allocations
  for each row execute function public.set_updated_at();

-- Fund fee structures
create table if not exists public.super_fund_fees (
  id uuid default gen_random_uuid() primary key,
  fund_id text references public.super_fund_reference not null,
  admin_fee_flat numeric(8,2) default 0,
  admin_fee_pct numeric(5,3) default 0,
  investment_fee_pct numeric(5,3) default 0,
  performance_fee_pct numeric(5,3),
  transaction_cost_pct numeric(5,3),
  total_on_50k numeric(8,2),
  total_on_100k numeric(8,2),
  source text,
  updated_at timestamptz default now(),
  unique(fund_id)
);

comment on table public.super_fund_fees is 'Fee structures per fund. Auto-refreshed from APRA QSPS data.';

create trigger super_fund_fees_set_updated_at
  before update on public.super_fund_fees
  for each row execute function public.set_updated_at();

-- ATO YourSuper performance test results
create table if not exists public.super_yoursuper_status (
  id uuid default gen_random_uuid() primary key,
  fund_id text references public.super_fund_reference not null,
  assessment text not null check (assessment in ('performing', 'underperforming', 'not_assessed')),
  net_return_pa numeric(6,2),
  fees_pa_on_50k numeric(8,2),
  ranking integer,
  data_date date not null,
  fetched_at timestamptz default now(),
  unique(fund_id, data_date)
);

comment on table public.super_yoursuper_status is 'ATO YourSuper performance test results. Auto-refreshed from ATO API.';

create index idx_yoursuper_fund on public.super_yoursuper_status(fund_id);

-- Reference tables are shared data — readable by any authenticated user.
-- Writes are done by the service role (pipeline scripts/Edge Functions).
alter table public.super_fund_reference enable row level security;
alter table public.super_fund_returns enable row level security;
alter table public.super_fund_allocations enable row level security;
alter table public.super_fund_fees enable row level security;
alter table public.super_yoursuper_status enable row level security;

create policy "Authenticated users can read fund reference"
  on public.super_fund_reference for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read fund returns"
  on public.super_fund_returns for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read fund allocations"
  on public.super_fund_allocations for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read fund fees"
  on public.super_fund_fees for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read yoursuper status"
  on public.super_yoursuper_status for select
  using (auth.role() = 'authenticated');
