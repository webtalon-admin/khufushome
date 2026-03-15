# Super Data Pipeline

Automated refresh of superannuation reference data from free government sources.

## Setup

```bash
cd scripts/super-pipeline
python3 -m venv .venv
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
python ingest_apra.py              # download from APRA + ingest
python ingest_apra.py --seed       # seed first, then APRA data
python ingest_apra.py --inspect    # download and print CSV column structure (no DB writes)
python ingest_apra.py --local-perf /path/to/perf.csv   # use local file instead of downloading
python ingest_apra.py --local-saa /path/to/saa.csv     # use local SAA file
```

### Via pnpm (from repo root)

```bash
pnpm run pipeline:seed
pnpm run pipeline:apra
```

## Inspect Mode

On first run or when APRA changes their CSV format, use `--inspect` to see the actual
column names without writing to the database:

```bash
python ingest_apra.py --inspect
```

This downloads the CSVs, prints all column names with indices, shows the first 3 rows,
and reports which columns were auto-resolved vs missing. If any required columns show
`MISSING`, update the candidate lists in `config.py` (`PERF_COL` / `SAA_COL`).

## How It Works

1. **Download**: Streams the 70MB+ Historical Performance and 139MB+ Historical SAA CSVs
   from APRA's public website to temp files.

2. **Column Resolution**: APRA column names vary between releases. The script tries
   multiple known column name patterns (defined in `config.py`) and falls back to
   case-insensitive/underscore-normalised matching.

3. **ABN Filtering**: Filters the (potentially hundreds of thousands of) rows down to
   only the 10 tracked fund ABNs.

4. **Option Matching**: For ABNs with multiple tracked options (e.g. Hostplus Balanced
   vs Shares Plus), matches on product/option name patterns.

5. **FY Derivation**: Converts quarter end dates to Australian financial year labels
   (e.g. 2025-06-30 -> FY2025).

6. **Upsert**: Idempotently upserts into `super_fund_returns` and `super_fund_allocations`
   using Supabase's `upsert` with conflict keys. New quarters are added; existing data
   is updated.

7. **Logging**: All runs are logged to `data_pipeline_logs` for the UI freshness indicator.

## Tracked Funds

See `config.py` for the 10 tracked funds with ABNs, APRA name patterns, and metadata.

## Data Flow

1. **Seed**: `research/super-research/data/*.csv` -> Supabase tables
2. **APRA**: APRA website CSVs -> filter by ABN -> Supabase tables
3. **ATO YourSuper**: ATO API -> Supabase (via Edge Function, not this script)

All runs are logged to `data_pipeline_logs` for UI freshness indicators.
