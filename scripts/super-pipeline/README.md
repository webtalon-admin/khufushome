# Super Data Pipeline

Automated refresh of superannuation reference data from free government sources.

## Setup

```bash
cd scripts/super-pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

```bash
export SUPABASE_URL="http://127.0.0.1:54321"           # local
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

For production, use the Supabase project URL and the service role key from the dashboard.

## Scripts

### Seed (one-time)

Import data from `research/super-research/` CSVs into Supabase:

```bash
python seed.py
```

### APRA Ingestion (quarterly)

Download APRA Historical Performance + SAA CSVs, filter for tracked funds, upsert:

```bash
python ingest_apra.py          # APRA data only
python ingest_apra.py --seed   # seed first, then APRA data
```

### Via pnpm (from repo root)

```bash
pnpm run pipeline:seed
pnpm run pipeline:apra
```

## Tracked Funds

See `config.py` for the 10 tracked funds with ABNs and metadata.

## Data Flow

1. **Seed**: `research/super-research/data/*.csv` → Supabase tables
2. **APRA**: APRA website CSVs → filter by ABN → Supabase tables
3. **ATO YourSuper**: ATO API → Supabase (via Edge Function, not this script)

All runs are logged to `data_pipeline_logs` for UI freshness indicators.
