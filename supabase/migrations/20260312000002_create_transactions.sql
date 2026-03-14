-- Finance: transactions table
-- All income/expense/transfer transactions, including CSV imports.

create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  account_id uuid references public.accounts not null,
  amount numeric(14,2) not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  category text not null,
  subcategory text,
  description text,
  date date not null,
  is_recurring boolean default false,
  recurrence_rule text,
  import_hash text,
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

comment on table public.transactions is 'Financial transactions (income, expense, transfer) with CSV import dedup.';
comment on column public.transactions.import_hash is 'SHA-256 of (date+amount+description) for CSV import duplicate detection.';
comment on column public.transactions.recurrence_rule is 'iCal RRULE string for recurring transactions.';

create index idx_txn_import_hash on public.transactions(import_hash);
create index idx_txn_date on public.transactions(user_id, date);
create index idx_txn_account on public.transactions(account_id);
create index idx_txn_category on public.transactions(user_id, category);

alter table public.transactions enable row level security;

create policy "Users can read own transactions"
  on public.transactions for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own transactions"
  on public.transactions for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (user_id = (select auth.uid()));
