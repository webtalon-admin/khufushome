-- Finance: budgets + budget_categories tables

create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  period text not null default 'monthly' check (period in ('weekly', 'fortnightly', 'monthly', 'quarterly', 'annually')),
  start_date date not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

comment on table public.budgets is 'Budget definitions with configurable period.';

create index idx_budgets_user on public.budgets(user_id);

alter table public.budgets enable row level security;

create policy "Users can read own budgets"
  on public.budgets for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own budgets"
  on public.budgets for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own budgets"
  on public.budgets for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own budgets"
  on public.budgets for delete
  using (user_id = (select auth.uid()));

-- Budget category allocations
create table if not exists public.budget_categories (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid not null references public.budgets on delete cascade,
  category text not null,
  allocated numeric(14,2) not null,
  rollover boolean default false
);

comment on table public.budget_categories is 'Per-category allocation within a budget.';
comment on column public.budget_categories.rollover is 'If true, unspent amount rolls into the next period.';

create index idx_budget_categories_budget on public.budget_categories(budget_id);

alter table public.budget_categories enable row level security;

-- budget_categories inherits access from the parent budget
create policy "Users can read own budget categories"
  on public.budget_categories for select
  using (budget_id in (select id from public.budgets where user_id = (select auth.uid())));

create policy "Users can insert own budget categories"
  on public.budget_categories for insert
  with check (budget_id in (select id from public.budgets where user_id = (select auth.uid())));

create policy "Users can update own budget categories"
  on public.budget_categories for update
  using (budget_id in (select id from public.budgets where user_id = (select auth.uid())));

create policy "Users can delete own budget categories"
  on public.budget_categories for delete
  using (budget_id in (select id from public.budgets where user_id = (select auth.uid())));
