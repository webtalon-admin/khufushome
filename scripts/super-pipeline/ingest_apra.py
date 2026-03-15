"""
APRA CSV Ingestion pipeline.

Downloads the Historical Performance and Historical SAA CSVs from APRA,
filters for tracked funds (by ABN + option name), transforms rows into
Supabase table schemas, and upserts idempotently.

Historical Performance CSV structure (Dec 2025 QSPS):
  - One row per fund per quarter
  - `return_measurement_comparison_percent` is a quarterly return (decimal)
  - Annual FY returns are compounded from the 4 quarterly figures

Historical SAA CSV structure (Dec 2025 QSPS):
  - Long format: one row per fund per sector per quarter
  - Pivoted into wide format (one row per fund) for our DB schema

Usage:
    python ingest_apra.py                # download + ingest
    python ingest_apra.py --seed         # run seed.py first, then ingest
    python ingest_apra.py --inspect      # download and print CSV structure (no DB writes)
    python ingest_apra.py --local-perf FILE  # use a local CSV instead of downloading
    python ingest_apra.py --local-saa FILE   # use a local SAA CSV

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (except --inspect).
"""

import argparse
import math
import os
import sys
import tempfile
from datetime import date, datetime

import pandas as pd
import requests
from supabase import create_client

from config import (
    APRA_URLS,
    FUND_ABN_MAP,
    PERF_COL,
    SAA_COL,
    SAA_EQUITY_SECTORS,
    SAA_SECTOR_MAP,
)

CHUNK_SIZE = 8192
BATCH_SIZE = 500


# ─────────────────────────────────────────────────────────────
#  Shared helpers
# ─────────────────────────────────────────────────────────────

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


def filter_tracked_funds(df: pd.DataFrame, abn_col: str) -> pd.DataFrame:
    """Filter DataFrame to only rows matching tracked fund ABNs."""
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


def parse_period(raw) -> pd.Timestamp | None:
    """Parse period_end_date (dd/mm/yyyy) or time_key (YYYYMMDD) into a Timestamp."""
    s = str(raw).strip()
    if len(s) == 8 and s.isdigit():
        try:
            return pd.Timestamp(year=int(s[:4]), month=int(s[4:6]), day=int(s[6:8]))
        except ValueError:
            return None
    try:
        return pd.to_datetime(s, dayfirst=True)
    except Exception:
        return None


def period_to_fy(dt: pd.Timestamp) -> str:
    """AU financial year label: Jul-Jun. FY2025 = Jul 2024 - Jun 2025."""
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
#
#  The CSV has quarterly return figures as decimals.
#  We compound Q1*Q2*Q3*Q4 within each FY to get annual returns:
#    FY2025 quarters: Sep-2024, Dec-2024, Mar-2025, Jun-2025
# ─────────────────────────────────────────────────────────────

def ingest_historical_performance(sb, csv_path: str | None = None) -> int:
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

    abn_col = cols.get("abn")
    qtr_col = cols.get("quarter_end")
    ret_col = cols.get("quarterly_return")
    product_col = cols.get("product_name")

    if not abn_col or not qtr_col or not ret_col:
        missing = [k for k in ("abn", "quarter_end", "quarterly_return") if not cols.get(k)]
        err = f"Missing required columns: {missing}. Available: {df.columns.tolist()[:15]}"
        print(f"  ERROR: {err}")
        log_pipeline(sb, "apra_performance", "error", error=err, started_at=started_at)
        return 0

    df = filter_tracked_funds(df, abn_col)
    if df.empty:
        log_pipeline(sb, "apra_performance", "success", rows=0, source_date=date.today(), started_at=started_at)
        return 0

    df["_period"] = df[qtr_col].apply(parse_period)
    df = df.dropna(subset=["_period"])
    df[ret_col] = pd.to_numeric(df[ret_col], errors="coerce")
    df = df.dropna(subset=[ret_col])

    df["_fund_id"] = df.apply(
        lambda r: match_fund_id(
            str(r[abn_col]).strip(),
            str(r[product_col]).strip() if product_col else "",
        ),
        axis=1,
    )
    df = df[df["_fund_id"].notna()]
    df["_fy"] = df["_period"].apply(period_to_fy)

    print(f"  Matched {len(df)} quarterly return rows across {df['_fund_id'].nunique()} funds.")
    print(f"  FY range: {df['_fy'].min()} - {df['_fy'].max()}")

    # Compound quarterly returns into annual FY returns.
    # (1 + r1) * (1 + r2) * ... * (1 + rN) - 1
    rows_to_upsert = []
    for (fund_id, fy), group in df.groupby(["_fund_id", "_fy"]):
        quarterly_returns = group[ret_col].values
        compounded = 1.0
        for qr in quarterly_returns:
            compounded *= (1.0 + float(qr))
        annual_return = (compounded - 1.0) * 100  # convert to percentage

        rows_to_upsert.append({
            "fund_id": fund_id,
            "fy": fy,
            "return_pct": round(annual_return, 2),
            "return_type": "after_investment_fees",
            "source": f"APRA QSPS (compounded from {len(quarterly_returns)} quarters)",
        })

    print(f"  Prepared {len(rows_to_upsert)} annual FY return rows for upsert.")

    if rows_to_upsert:
        for i in range(0, len(rows_to_upsert), BATCH_SIZE):
            batch = rows_to_upsert[i : i + BATCH_SIZE]
            sb.table("super_fund_returns").upsert(batch, on_conflict="fund_id,fy").execute()
            print(f"  Upserted batch {i // BATCH_SIZE + 1} ({len(batch)} rows)")

    log_pipeline(
        sb, "apra_performance", "success",
        rows=len(rows_to_upsert), source_date=date.today(), started_at=started_at,
    )
    return len(rows_to_upsert)


# ─────────────────────────────────────────────────────────────
#  Historical SAA -> super_fund_allocations
#
#  The CSV is in LONG format:
#    fund | quarter | sector_type | domicile | allocation_pct
#  We pivot into WIDE format:
#    fund | australian_equities | international_equities | property | ...
#
#  Sector classification uses InvestmentStrategicSectorType.
#  Equity is split by domicile (Australian Domicile vs others).
# ─────────────────────────────────────────────────────────────

def classify_sector(sector: str, domicile: str) -> str | None:
    """Map an APRA sector+domicile pair to our DB column name."""
    sector_lower = sector.lower().strip() if sector else ""
    domicile_lower = domicile.lower().strip() if domicile else ""

    if sector_lower in SAA_SECTOR_MAP:
        return SAA_SECTOR_MAP[sector_lower]

    if sector_lower in SAA_EQUITY_SECTORS:
        if "australian" in domicile_lower or "domestic" in domicile_lower:
            return "australian_equities"
        return "international_equities"

    return "alternatives"


def ingest_historical_saa(sb, csv_path: str | None = None) -> int:
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

    abn_col = cols.get("abn")
    qtr_col = cols.get("quarter_end")
    sector_col = cols.get("sector_type")
    alloc_col = cols.get("allocation_pct")
    product_col = cols.get("product_name")
    domicile_col = cols.get("domicile")

    required = {"abn": abn_col, "sector_type": sector_col, "allocation_pct": alloc_col}
    missing = [k for k, v in required.items() if not v]
    if missing:
        err = f"Missing required columns: {missing}. Available: {df.columns.tolist()[:15]}"
        print(f"  ERROR: {err}")
        log_pipeline(sb, "apra_saa", "error", error=err, started_at=started_at)
        return 0

    df = filter_tracked_funds(df, abn_col)
    if df.empty:
        log_pipeline(sb, "apra_saa", "success", rows=0, source_date=date.today(), started_at=started_at)
        return 0

    if qtr_col:
        df["_period"] = df[qtr_col].apply(parse_period)
        df = df.dropna(subset=["_period"])
    else:
        df["_period"] = pd.Timestamp.now()

    df[alloc_col] = pd.to_numeric(df[alloc_col], errors="coerce")

    df["_fund_id"] = df.apply(
        lambda r: match_fund_id(
            str(r[abn_col]).strip(),
            str(r[product_col]).strip() if product_col else "",
        ),
        axis=1,
    )
    df = df[df["_fund_id"].notna()]

    # Take only the latest quarter per fund
    latest_qtr = df.groupby("_fund_id")["_period"].max().reset_index()
    latest_qtr.columns = ["_fund_id", "_latest_period"]
    df = df.merge(latest_qtr, on="_fund_id")
    df = df[df["_period"] == df["_latest_period"]]

    print(f"  Processing {len(df)} sector rows for {df['_fund_id'].nunique()} funds (latest quarter each).")

    alloc_fields = [
        "australian_equities", "international_equities", "property",
        "infrastructure", "private_equity", "alternatives", "fixed_income", "cash",
    ]

    rows_to_upsert = []
    for fund_id, group in df.groupby("_fund_id"):
        alloc_data: dict = {f: 0.0 for f in alloc_fields}

        for _, row in group.iterrows():
            sector_val = str(row[sector_col]) if not pd.isna(row[sector_col]) else ""
            domicile_val = str(row[domicile_col]) if domicile_col and not pd.isna(row.get(domicile_col)) else ""
            pct = float(row[alloc_col]) if not pd.isna(row[alloc_col]) else 0.0

            if pct <= 1:
                pct *= 100

            db_col = classify_sector(sector_val, domicile_val)
            if db_col and db_col in alloc_data:
                alloc_data[db_col] += pct

        total = sum(alloc_data.values())
        if total < 1:
            continue

        row_out = {"fund_id": fund_id, "source": "APRA QSPS Historical SAA"}
        for f in alloc_fields:
            row_out[f] = round(alloc_data[f], 2) if alloc_data[f] > 0 else None
        rows_to_upsert.append(row_out)

    print(f"  Prepared {len(rows_to_upsert)} allocation rows for upsert.")

    if rows_to_upsert:
        sb.table("super_fund_allocations").upsert(rows_to_upsert, on_conflict="fund_id").execute()

    log_pipeline(
        sb, "apra_saa", "success",
        rows=len(rows_to_upsert), source_date=date.today(), started_at=started_at,
    )
    return len(rows_to_upsert)


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
