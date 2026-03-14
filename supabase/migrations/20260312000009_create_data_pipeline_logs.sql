-- Finance: data pipeline logging table
-- Tracks execution of automated data refresh jobs (APRA CSV ingestion, ATO YourSuper API).

create table if not exists public.data_pipeline_logs (
  id uuid default gen_random_uuid() primary key,
  pipeline text not null,
  status text not null check (status in ('running', 'success', 'error')),
  rows_upserted integer default 0,
  error_message text,
  source_date date,
  started_at timestamptz default now(),
  completed_at timestamptz
);

comment on table public.data_pipeline_logs is 'Execution log for data pipeline jobs. Used to display data freshness in the UI.';

create index idx_pipeline_logs_pipeline on public.data_pipeline_logs(pipeline, started_at desc);

-- Pipeline logs are shared data — readable by any authenticated user.
-- Writes are done by the service role (pipeline scripts/Edge Functions).
alter table public.data_pipeline_logs enable row level security;

create policy "Authenticated users can read pipeline logs"
  on public.data_pipeline_logs for select
  using (auth.role() = 'authenticated');
