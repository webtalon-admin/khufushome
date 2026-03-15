"""
APRA CSV Ingestion pipeline.

Downloads the Historical Performance and Historical SAA CSVs from APRA,
filters for tracked funds (by ABN + option name), transforms rows into
Supabase table schemas, and upserts idempotently.

Usage:
    python ingest_apra.py                # download + ingest
    python ingest_apra.py --seed         # run seed.py first, then ingest
    python ingest_apra.py --inspect      # download and print CSV structure (no DB writes)
    python ingest_apra.py --local FILE   # use a local CSV instead of downloading

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (except --inspect).
"""

import argparse
import os
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path

import pandas as pd
import requests
from supabase import create_client

from config import (
    APRA_URLS,
    FEES_COL,
    FUND_ABN_MAP,
    PERF_COL,
    SAA_COL,
    TRACKED_FUNDS,
)

CHUNK_SIZE = 8192
BATCH_SIZE = 500


def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
        sys.exit(1)
    return create_client(url, key)


def log_pipeline(
    sb, pipeline: str, status: str,
    rows: int = 0, error: str | None = None,
    source_date: date | None = None,
    started_at: datetime | None = None,
):
    row = {
        "pipeline": pipeline,
        "status": status,
        "rows_upserted": rows,
        "error_message": error,
        "source_date": source_date.isoformat() if source_date else None,
        "started_at": (started_at or datetime.utcnow()).isoformat(),
    }
    if status in ("success", "error"):
        row["completed_at"] = datetime.utcnow().isoformat()
    sb.table("data_pipeline_logs").insert(row).execute()


def download_csv(url: str, label: str) -> str | None:
    """Download a CSV to a temp file. Returns path or None on failure."""
    print(f"  Downloading {label}...")
    try:
        resp = requests.get(url, stream=True, timeout=600)
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


def resolve_column(df_columns: list[str], candidates: list[str]) -> str | None:
    """Find the first matching column name from a list of candidates."""
    col_set = set(df_columns)
    for c in candidates:
        if c in col_set:
            return c
    lower_map = {col.lower().replace(" ", "_"): col for col in df_columns}
    for c in candidates:
        normalised = c.lower().replace(" ", "_")
        if normalised in lower_map:
            return lower_map[normalised]
    return None


def resolve_columns(df_columns: list[str], col_map: dict) -> dict[str, str | None]:
    """Resolve a full column spec dict against actual DataFrame columns."""
    resolved = {}
    for key, candidates in col_map.items():
        resolved[key] = resolve_column(df_columns, candidates)
    return resolved


def filter_tracked_funds(df: pd.DataFrame, abn_col: str | None) -> pd.DataFrame:
    """Filter DataFrame to only rows matching tracked fund ABNs."""
    if abn_col is None:
        print("  WARNING: No ABN column found — cannot filter by fund. Returning empty.")
        return df.iloc[0:0]

    df[abn_col] = df[abn_col].astype(str).str.strip().str.replace(" ", "")
    tracked_abns = set(FUND_ABN_MAP.keys())
    filtered = df[df[abn_col].isin(tracked_abns)].copy()
    print(f"  Filtered {len(df)} -> {len(filtered)} rows (matched {len(tracked_abns)} tracked ABNs)")
    return filtered


def match_fund_id(abn: str, product_name: str) -> str | None:
    """
    Given an ABN and product/option name from APRA, find the matching fund_id.
    Multiple funds can share an ABN (e.g. Hostplus Balanced vs Shares Plus),
    so we match on the option name patterns.
    """
    funds = FUND_ABN_MAP.get(abn, [])
    if not funds:
        return None
    if len(funds) == 1:
        return funds[0].id

    product_lower = product_name.lower() if product_name else ""
    for fund in funds:
        for pattern in fund.apra_product_patterns:
            if pattern.lower() in product_lower:
                return fund.id
    return None


def quarter_to_fy(quarter_str: str) -> str | None:
    """
    Convert a quarter end date string to an Australian financial year label.
    e.g. "2025-06-30" -> "FY2025", "2024-12-31" -> "FY2025"
    AU FY runs Jul 1 to Jun 30.  FY2025 = Jul 2024 - Jun 2025.
    """
    try:
        dt = pd.to_datetime(quarter_str)
    except Exception:
        return None
    if dt.month >= 7:
        return f"FY{dt.year + 1}"
    return f"FY{dt.year}"


def inspect_csv(csv_path: str, label: str):
    """Print CSV structure for debugging column mapping."""
    print(f"\n{'=' * 60}")
    print(f"INSPECTING: {label}")
    print(f"{'=' * 60}")
    df = pd.read_csv(csv_path, low_memory=False, nrows=20)
    print(f"\nShape (first 20 rows): {df.shape}")
    print(f"\nColumns ({len(df.columns)}):")
    for i, col in enumerate(df.columns):
        print(f"  [{i:3d}] {col}")
    print(f"\nFirst 3 rows:")
    print(df.head(3).to_string())
    print()
    return df.columns.tolist()


# ─────────────────────────────────────────────────────────────
#  Historical Performance -> super_fund_returns
# ─────────────────────────────────────────────────────────────

def ingest_historical_performance(sb, csv_path: str | None = None) -> int:
    """
    Download (or use provided) APRA Historical Performance CSV,
    filter for tracked funds, extract the latest quarterly return data,
    and upsert into super_fund_returns.
    """
    started_at = datetime.utcnow()

    if csv_path is None:
        csv_path = download_csv(APRA_URLS["historical_performance"], "Historical Performance")
    if not csv_path:
        log_pipeline(sb, "apra_performance", "error", error="Download failed", started_at=started_at)
        return 0

    print("  Parsing Historical Performance CSV...")
    try:
        df = pd.read_csv(csv_path, low_memory=False)
    except Exception as e:
        print(f"  Parse error: {e}")
        log_pipeline(sb, "apra_performance", "error", error=str(e), started_at=started_at)
        return 0

    cols = resolve_columns(df.columns.tolist(), PERF_COL)
    print(f"  Resolved columns: { {k: v for k, v in cols.items() if v} }")
    missing = [k for k in ("abn", "quarter_end") if cols[k] is None]
    if missing:
        err = f"Missing required columns: {missing}. Available: {df.columns.tolist()[:20]}"
        print(f"  ERROR: {err}")
        log_pipeline(sb, "apra_performance", "error", error=err, started_at=started_at)
        return 0

    df = filter_tracked_funds(df, cols["abn"])
    if df.empty:
        log_pipeline(sb, "apra_performance", "success", rows=0, source_date=date.today(), started_at=started_at)
        return 0

    product_col = cols["product_name"]

    # APRA provides quarterly snapshots with annualised returns over 1/3/5/7/10 yr windows.
    # We want to extract the most recent FY return for each fund.
    # Strategy: group by ABN + product, take the latest quarter, then store the
    # 1-year net investment return as the FY return for that period.
    qtr_col = cols["quarter_end"]
    df[qtr_col] = pd.to_datetime(df[qtr_col], errors="coerce")
    df = df.dropna(subset=[qtr_col])

    return_col = cols.get("return_1yr")
    if return_col is None:
        for period in ("return_3yr", "return_5yr", "return_7yr", "return_10yr"):
            if cols.get(period):
                return_col = cols[period]
                break
    if return_col is None:
        err = "No return columns found in CSV."
        print(f"  ERROR: {err}")
        log_pipeline(sb, "apra_performance", "error", error=err, started_at=started_at)
        return 0

    print(f"  Using return column: {return_col}")

    rows_to_upsert = []
    abn_col = cols["abn"]

    for _, row in df.iterrows():
        abn_val = str(row[abn_col]).strip()
        product_val = str(row[product_col]).strip() if product_col else ""
        fund_id = match_fund_id(abn_val, product_val)
        if fund_id is None:
            continue

        fy = quarter_to_fy(row[qtr_col])
        if fy is None:
            continue

        ret_val = row.get(return_col)
        if pd.isna(ret_val):
            continue

        ret_pct = float(ret_val)
        if abs(ret_pct) < 1:
            ret_pct *= 100

        rows_to_upsert.append({
            "fund_id": fund_id,
            "fy": fy,
            "return_pct": round(ret_pct, 2),
            "return_type": "after_investment_fees",
            "source": "APRA QSPS Historical Performance",
        })

    # Deduplicate: keep latest row per (fund_id, fy)
    seen = {}
    for r in rows_to_upsert:
        key = (r["fund_id"], r["fy"])
        seen[key] = r
    unique_rows = list(seen.values())

    print(f"  Prepared {len(unique_rows)} unique return rows for upsert.")

    if unique_rows:
        for i in range(0, len(unique_rows), BATCH_SIZE):
            batch = unique_rows[i : i + BATCH_SIZE]
            sb.table("super_fund_returns").upsert(batch, on_conflict="fund_id,fy").execute()
            print(f"  Upserted batch {i // BATCH_SIZE + 1} ({len(batch)} rows)")

    log_pipeline(
        sb, "apra_performance", "success",
        rows=len(unique_rows), source_date=date.today(), started_at=started_at,
    )
    return len(unique_rows)


# ─────────────────────────────────────────────────────────────
#  Historical SAA -> super_fund_allocations
# ─────────────────────────────────────────────────────────────

def ingest_historical_saa(sb, csv_path: str | None = None) -> int:
    """
    Download (or use provided) APRA Historical SAA CSV,
    filter for tracked funds, extract the latest asset allocation snapshot,
    and upsert into super_fund_allocations.
    """
    started_at = datetime.utcnow()

    if csv_path is None:
        csv_path = download_csv(APRA_URLS["historical_saa"], "Historical SAA")
    if not csv_path:
        log_pipeline(sb, "apra_saa", "error", error="Download failed", started_at=started_at)
        return 0

    print("  Parsing Historical SAA CSV...")
    try:
        df = pd.read_csv(csv_path, low_memory=False)
    except Exception as e:
        print(f"  Parse error: {e}")
        log_pipeline(sb, "apra_saa", "error", error=str(e), started_at=started_at)
        return 0

    cols = resolve_columns(df.columns.tolist(), SAA_COL)
    print(f"  Resolved columns: { {k: v for k, v in cols.items() if v} }")
    missing = [k for k in ("abn",) if cols[k] is None]
    if missing:
        err = f"Missing required columns: {missing}. Available: {df.columns.tolist()[:20]}"
        print(f"  ERROR: {err}")
        log_pipeline(sb, "apra_saa", "error", error=err, started_at=started_at)
        return 0

    df = filter_tracked_funds(df, cols["abn"])
    if df.empty:
        log_pipeline(sb, "apra_saa", "success", rows=0, source_date=date.today(), started_at=started_at)
        return 0

    # Sort by quarter date descending to pick the latest allocation per fund
    qtr_col = cols.get("quarter_end")
    if qtr_col:
        df[qtr_col] = pd.to_datetime(df[qtr_col], errors="coerce")
        df = df.sort_values(qtr_col, ascending=False)

    abn_col = cols["abn"]
    product_col = cols.get("product_name")

    alloc_fields = [
        "australian_equities", "international_equities", "property",
        "infrastructure", "private_equity", "alternatives", "fixed_income", "cash",
    ]

    seen_funds: set[str] = set()
    rows_to_upsert = []

    for _, row in df.iterrows():
        abn_val = str(row[abn_col]).strip()
        product_val = str(row[product_col]).strip() if product_col else ""
        fund_id = match_fund_id(abn_val, product_val)
        if fund_id is None or fund_id in seen_funds:
            continue

        alloc_data: dict = {"fund_id": fund_id, "source": "APRA QSPS Historical SAA"}
        has_any = False
        for field in alloc_fields:
            resolved_col = cols.get(field)
            if resolved_col is None:
                alloc_data[field] = None
                continue
            val = row.get(resolved_col)
            if pd.isna(val):
                alloc_data[field] = None
            else:
                pct = float(val)
                if pct <= 1:
                    pct *= 100
                alloc_data[field] = round(pct, 2)
                has_any = True

        if has_any:
            rows_to_upsert.append(alloc_data)
            seen_funds.add(fund_id)

    print(f"  Prepared {len(rows_to_upsert)} allocation rows for upsert.")

    if rows_to_upsert:
        sb.table("super_fund_allocations").upsert(rows_to_upsert, on_conflict="fund_id").execute()

    log_pipeline(
        sb, "apra_saa", "success",
        rows=len(rows_to_upsert), source_date=date.today(), started_at=started_at,
    )
    return len(rows_to_upsert)


# ─────────────────────────────────────────────────────────────
#  QSPS Tables 4-11 -> super_fund_fees (optional, future)
# ─────────────────────────────────────────────────────────────
# The fee data comes from the Tables 4-11 ZIP which contains multiple CSVs.
# For now fees are seeded from research CSVs; this can be extended later.


# ─────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="APRA CSV ingestion pipeline")
    parser.add_argument("--seed", action="store_true", help="Run seed.py first to import research CSVs")
    parser.add_argument("--inspect", action="store_true", help="Download CSVs and print structure (no DB writes)")
    parser.add_argument("--local-perf", type=str, help="Path to a local Historical Performance CSV")
    parser.add_argument("--local-saa", type=str, help="Path to a local Historical SAA CSV")
    args = parser.parse_args()

    if args.inspect:
        print("APRA CSV Inspection Mode")
        print("=" * 60)

        perf_path = args.local_perf or download_csv(APRA_URLS["historical_performance"], "Historical Performance")
        if perf_path:
            perf_cols = inspect_csv(perf_path, "Historical Performance")
            resolved = resolve_columns(perf_cols, PERF_COL)
            print("Resolved Performance columns:")
            for k, v in resolved.items():
                status = "OK" if v else "MISSING"
                print(f"  {k:20s} -> {v or '???':40s} [{status}]")

        saa_path = args.local_saa or download_csv(APRA_URLS["historical_saa"], "Historical SAA")
        if saa_path:
            saa_cols = inspect_csv(saa_path, "Historical SAA")
            resolved = resolve_columns(saa_cols, SAA_COL)
            print("Resolved SAA columns:")
            for k, v in resolved.items():
                status = "OK" if v else "MISSING"
                print(f"  {k:20s} -> {v or '???':40s} [{status}]")
        return

    if args.seed:
        print("Running seed first...")
        from seed import main as seed_main
        seed_main()
        print()

    print("APRA CSV Ingestion Pipeline")
    print("=" * 60)
    sb = get_supabase()

    overall_start = datetime.utcnow()
    log_pipeline(sb, "apra_ingestion", "running", started_at=overall_start)

    try:
        perf_rows = ingest_historical_performance(sb, csv_path=args.local_perf)
        saa_rows = ingest_historical_saa(sb, csv_path=args.local_saa)

        total = perf_rows + saa_rows
        log_pipeline(
            sb, "apra_ingestion", "success",
            rows=total, source_date=date.today(), started_at=overall_start,
        )
        print(f"\nComplete. Performance: {perf_rows} rows, SAA: {saa_rows} rows. Total: {total}")
    except Exception as e:
        log_pipeline(sb, "apra_ingestion", "error", error=str(e), started_at=overall_start)
        print(f"\nPipeline failed: {e}")
        raise


if __name__ == "__main__":
    main()
