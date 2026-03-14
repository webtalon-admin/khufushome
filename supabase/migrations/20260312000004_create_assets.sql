-- Finance: assets, asset_transactions, price_history tables
-- Portfolio holdings with CGT tracking and price caching.

create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  account_id uuid references public.accounts,
  symbol text not null,
  name text not null,
  asset_type text not null check (asset_type in (
    'stock_asx', 'stock_us', 'crypto', 'etf', 'property'
  )),
  quantity numeric(18,8) not null default 0,
  avg_cost_base numeric(14,4),
  currency text default 'AUD',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.assets is 'Portfolio holdings: ASX/US stocks, crypto, ETFs, property.';

create index idx_assets_user on public.assets(user_id);
create index idx_assets_symbol on public.assets(symbol);

alter table public.assets enable row level security;

create policy "Users can read own assets"
  on public.assets for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own assets"
  on public.assets for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own assets"
  on public.assets for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own assets"
  on public.assets for delete
  using (user_id = (select auth.uid()));

create trigger assets_set_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

-- Asset transactions (buy/sell/dividend) for CGT tracking
create table if not exists public.asset_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  asset_id uuid references public.assets not null,
  type text not null check (type in (
    'buy', 'sell', 'dividend', 'distribution', 'split', 'transfer_in', 'transfer_out'
  )),
  quantity numeric(18,8) not null,
  price_per_unit numeric(14,4) not null,
  fees numeric(14,2) default 0,
  total_value numeric(14,2) not null,
  date date not null,
  notes text,
  created_at timestamptz default now()
);

comment on table public.asset_transactions is 'Buy/sell/dividend records for CGT calculation (FIFO method).';

create index idx_asset_txn_asset on public.asset_transactions(asset_id);
create index idx_asset_txn_user_date on public.asset_transactions(user_id, date);

alter table public.asset_transactions enable row level security;

create policy "Users can read own asset transactions"
  on public.asset_transactions for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own asset transactions"
  on public.asset_transactions for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own asset transactions"
  on public.asset_transactions for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own asset transactions"
  on public.asset_transactions for delete
  using (user_id = (select auth.uid()));

-- Price history cache (shared, not per-user)
create table if not exists public.price_history (
  id uuid default gen_random_uuid() primary key,
  symbol text not null,
  price_aud numeric(14,4) not null,
  source text not null,
  recorded_at timestamptz default now()
);

comment on table public.price_history is 'Cached price data from CoinGecko/Yahoo Finance. Not user-scoped.';

create index idx_price_symbol_date on public.price_history(symbol, recorded_at);

-- Price history is shared data, no RLS user filtering needed.
-- Only authenticated users can read; inserts handled by service role (Edge Functions).
alter table public.price_history enable row level security;

create policy "Authenticated users can read prices"
  on public.price_history for select
  using (auth.role() = 'authenticated');
