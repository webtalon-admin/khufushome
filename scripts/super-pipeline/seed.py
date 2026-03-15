"""
One-time seed: import data from research/super-research/ CSV/YAML files
into Supabase tables.

Usage:
    python scripts/super-pipeline/seed.py

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
"""

import csv
import json
import os
import sys
from pathlib import Path

from supabase import create_client

from config import FUND_ID_MAP, TRACKED_FUNDS

RESEARCH_DIR = Path(__file__).resolve().parent.parent.parent / "research" / "super-research"
DATA_DIR = RESEARCH_DIR / "data"


def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
        sys.exit(1)
    return create_client(url, key)


def seed_fund_reference(sb):
    """Upsert fund reference data from config."""
    rows = []
    for f in TRACKED_FUNDS:
        rows.append({
            "id": f.id,
            "name": f.name,
            "option_name": f.option,
            "fund_type": f.fund_type,
            "abn": f.abn,
            "aum_billions": f.aum_billions,
            "members": f.members,
            "return_target": f.return_target,
            "growth_defensive_split": json.dumps(f.growth_defensive_split) if f.growth_defensive_split else None,
            "website": f.website,
            "notes": f.notes,
        })
    sb.table("super_fund_reference").upsert(rows, on_conflict="id").execute()
    print(f"  Seeded {len(rows)} fund reference rows.")


def seed_fund_returns(sb):
    """Import annual returns from CSV."""
    csv_path = DATA_DIR / "returns" / "annual_returns.csv"
    if not csv_path.exists():
        print("  Skipping fund returns — CSV not found.")
        return

    rows = []
    skipped = set()
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            fid = row["fund_id"]
            if fid not in FUND_ID_MAP:
                skipped.add(fid)
                continue
            rows.append({
                "fund_id": fid,
                "fy": row["fy"],
                "return_pct": float(row["return_pct"]),
                "return_type": row["return_type"],
                "source": row.get("source", ""),
            })

    if skipped:
        print(f"  Skipped {len(skipped)} untracked fund_ids: {skipped}")
    if rows:
        sb.table("super_fund_returns").upsert(rows, on_conflict="fund_id,fy").execute()
    print(f"  Seeded {len(rows)} fund return rows.")


def seed_fund_allocations(sb):
    """Import asset allocations from CSV."""
    csv_path = DATA_DIR / "allocations" / "asset_allocations.csv"
    if not csv_path.exists():
        print("  Skipping fund allocations — CSV not found.")
        return

    numeric_fields = [
        "australian_equities", "international_equities", "property",
        "infrastructure", "private_equity", "alternatives", "fixed_income", "cash",
    ]

    rows = []
    skipped = set()
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            fid = row["fund_id"]
            if fid not in FUND_ID_MAP:
                skipped.add(fid)
                continue
            data = {"fund_id": fid, "source": row.get("source", "")}
            for field in numeric_fields:
                val = row.get(field, "").strip()
                data[field] = float(val) if val else None
            rows.append(data)

    if skipped:
        print(f"  Skipped {len(skipped)} untracked fund_ids: {skipped}")
    if rows:
        sb.table("super_fund_allocations").upsert(rows, on_conflict="fund_id").execute()
    print(f"  Seeded {len(rows)} fund allocation rows.")


def seed_fund_fees(sb):
    """Import fee structures from CSV."""
    csv_path = DATA_DIR / "fees" / "fee_structures.csv"
    if not csv_path.exists():
        print("  Skipping fund fees — CSV not found.")
        return

    def to_float(val):
        v = val.strip() if val else ""
        return float(v) if v else None

    rows = []
    skipped = set()
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            fid = row["fund_id"]
            if fid not in FUND_ID_MAP:
                skipped.add(fid)
                continue
            rows.append({
                "fund_id": fid,
                "admin_fee_flat": to_float(row.get("admin_fee_flat", "")),
                "admin_fee_pct": to_float(row.get("admin_fee_pct", "")),
                "investment_fee_pct": to_float(row.get("investment_fee_pct", "")),
                "performance_fee_pct": to_float(row.get("performance_fee_pct", "")),
                "transaction_cost_pct": to_float(row.get("transaction_cost_pct", "")),
                "total_on_50k": to_float(row.get("total_on_50k", "")),
                "total_on_100k": to_float(row.get("total_on_100k", "")),
                "source": row.get("source", ""),
            })

    if skipped:
        print(f"  Skipped {len(skipped)} untracked fund_ids: {skipped}")
    if rows:
        sb.table("super_fund_fees").upsert(rows, on_conflict="fund_id").execute()
    print(f"  Seeded {len(rows)} fund fee rows.")


def main():
    print("Super pipeline: seeding reference data from research CSVs...")
    sb = get_supabase()

    seed_fund_reference(sb)
    seed_fund_returns(sb)
    seed_fund_allocations(sb)
    seed_fund_fees(sb)

    print("Done.")


if __name__ == "__main__":
    main()
