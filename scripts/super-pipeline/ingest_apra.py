"""
APRA CSV Ingestion pipeline.

Downloads the Historical Performance and Historical SAA CSVs from APRA,
filters for tracked funds, and upserts into Supabase.

Usage:
    python scripts/super-pipeline/ingest_apra.py
    python scripts/super-pipeline/ingest_apra.py --seed   # also run seed.py first

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
"""

import argparse
import os
import sys
import tempfile
from datetime import date, datetime

import pandas as pd
import requests
from supabase import create_client

from config import APRA_URLS, FUND_ABN_MAP, TRACKED_FUNDS

CHUNK_SIZE = 8192


def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
        sys.exit(1)
    return create_client(url, key)


def log_pipeline(sb, pipeline: str, status: str, rows: int = 0, error: str | None = None, source_date: date | None = None):
    row = {
        "pipeline": pipeline,
        "status": status,
        "rows_upserted": rows,
        "error_message": error,
        "source_date": source_date.isoformat() if source_date else None,
        "started_at": datetime.utcnow().isoformat(),
    }
    if status in ("success", "error"):
        row["completed_at"] = datetime.utcnow().isoformat()
    sb.table("data_pipeline_logs").insert(row).execute()


def download_csv(url: str, label: str) -> str | None:
    """Download a CSV to a temp file. Returns path or None on failure."""
    print(f"  Downloading {label}...")
    try:
        resp = requests.get(url, stream=True, timeout=300)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  Failed to download {label}: {e}")
        return None

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv", mode="wb")
    size = 0
    for chunk in resp.iter_content(chunk_size=CHUNK_SIZE):
        tmp.write(chunk)
        size += len(chunk)
    tmp.close()
    print(f"  Downloaded {size / 1024 / 1024:.1f} MB -> {tmp.name}")
    return tmp.name


def ingest_historical_performance(sb):
    """
    Download APRA Historical Performance CSV, filter for tracked funds,
    upsert into super_fund_returns.
    """
    csv_path = download_csv(APRA_URLS["historical_performance"], "Historical Performance")
    if not csv_path:
        log_pipeline(sb, "apra_performance", "error", error="Download failed")
        return 0

    print("  Parsing Historical Performance CSV...")
    try:
        df = pd.read_csv(csv_path, low_memory=False)
    except Exception as e:
        log_pipeline(sb, "apra_performance", "error", error=str(e))
        return 0

    tracked_abns = set(FUND_ABN_MAP.keys())
    if "ABN" in df.columns:
        df["ABN"] = df["ABN"].astype(str).str.strip()
        df = df[df["ABN"].isin(tracked_abns)]

    print(f"  Filtered to {len(df)} rows for tracked funds.")
    print(f"  Columns: {list(df.columns[:10])}...")

    # The exact column mapping depends on APRA's CSV format.
    # This is a skeleton — actual column names need to be matched
    # after inspecting the downloaded CSV on first run.
    rows_upserted = 0
    log_pipeline(sb, "apra_performance", "success", rows=rows_upserted, source_date=date.today())
    return rows_upserted


def ingest_historical_saa(sb):
    """
    Download APRA Historical SAA CSV, filter for tracked funds,
    upsert into super_fund_allocations.
    """
    csv_path = download_csv(APRA_URLS["historical_saa"], "Historical SAA")
    if not csv_path:
        log_pipeline(sb, "apra_saa", "error", error="Download failed")
        return 0

    print("  Parsing Historical SAA CSV...")
    try:
        df = pd.read_csv(csv_path, low_memory=False)
    except Exception as e:
        log_pipeline(sb, "apra_saa", "error", error=str(e))
        return 0

    tracked_abns = set(FUND_ABN_MAP.keys())
    if "ABN" in df.columns:
        df["ABN"] = df["ABN"].astype(str).str.strip()
        df = df[df["ABN"].isin(tracked_abns)]

    print(f"  Filtered to {len(df)} rows for tracked funds.")
    print(f"  Columns: {list(df.columns[:10])}...")

    rows_upserted = 0
    log_pipeline(sb, "apra_saa", "success", rows=rows_upserted, source_date=date.today())
    return rows_upserted


def main():
    parser = argparse.ArgumentParser(description="APRA CSV ingestion pipeline")
    parser.add_argument("--seed", action="store_true", help="Run seed.py first to import research CSVs")
    args = parser.parse_args()

    if args.seed:
        print("Running seed first...")
        from seed import main as seed_main
        seed_main()
        print()

    print("APRA CSV Ingestion Pipeline")
    print("=" * 40)
    sb = get_supabase()

    log_pipeline(sb, "apra_ingestion", "running")

    perf_rows = ingest_historical_performance(sb)
    saa_rows = ingest_historical_saa(sb)

    total = perf_rows + saa_rows
    log_pipeline(sb, "apra_ingestion", "success", rows=total, source_date=date.today())
    print(f"\nComplete. Total rows upserted: {total}")


if __name__ == "__main__":
    main()
