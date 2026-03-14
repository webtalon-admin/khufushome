-- Finance: loans + loan_payments tables
-- Generic loan model with type-specific metadata in JSONB.

create table if not exists public.loans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  loan_type text not null check (loan_type in (
    'mortgage', 'novated_lease', 'btc_backed', 'personal', 'car', 'margin'
  )),
  principal numeric(14,2) not null,
  current_balance numeric(14,2),
  interest_rate numeric(7,4) not null,
  rate_type text default 'variable' check (rate_type in ('fixed', 'variable', 'split')),
  term_months integer,
  monthly_payment numeric(14,2),
  start_date date not null,
  end_date date,
  extra_data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.loans is 'Loans: mortgage, novated lease, BTC-backed, personal, car, margin.';
comment on column public.loans.extra_data is 'Type-specific fields (e.g., collateral_btc/ltv for BTC-backed, residual_value for novated lease).';

create index idx_loans_user on public.loans(user_id);

alter table public.loans enable row level security;

create policy "Users can read own loans"
  on public.loans for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own loans"
  on public.loans for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own loans"
  on public.loans for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own loans"
  on public.loans for delete
  using (user_id = (select auth.uid()));

create trigger loans_set_updated_at
  before update on public.loans
  for each row execute function public.set_updated_at();

-- Loan payments
create table if not exists public.loan_payments (
  id uuid default gen_random_uuid() primary key,
  loan_id uuid references public.loans not null,
  user_id uuid references auth.users not null,
  amount numeric(14,2) not null,
  principal_portion numeric(14,2),
  interest_portion numeric(14,2),
  extra_payment numeric(14,2) default 0,
  payment_date date not null,
  created_at timestamptz default now()
);

comment on table public.loan_payments is 'Individual loan repayments with principal/interest split.';

create index idx_loan_payments_loan on public.loan_payments(loan_id);
create index idx_loan_payments_user on public.loan_payments(user_id, payment_date);

alter table public.loan_payments enable row level security;

create policy "Users can read own loan payments"
  on public.loan_payments for select
  using (user_id = (select auth.uid()));

create policy "Users can insert own loan payments"
  on public.loan_payments for insert
  with check (user_id = (select auth.uid()));

create policy "Users can update own loan payments"
  on public.loan_payments for update
  using (user_id = (select auth.uid()));

create policy "Users can delete own loan payments"
  on public.loan_payments for delete
  using (user_id = (select auth.uid()));
