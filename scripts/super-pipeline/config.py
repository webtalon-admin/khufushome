"""
Super pipeline configuration.

Tracked funds: ABNs, option names, and APRA download URLs.
Fund IDs match the `super_fund_reference.id` column in Supabase.
"""

from dataclasses import dataclass

APRA_BASE = "https://www.apra.gov.au/sites/default/files"

APRA_URLS = {
    "historical_performance": f"{APRA_BASE}/2026-03/Historical%20performance%20%281%29.csv",
    "historical_saa": f"{APRA_BASE}/2026-03/Historical%20SAA.csv",
    "qsps_tables_4_11": f"{APRA_BASE}/2026-03/QSPS%20December%202025%20CSV%20files%20-%20Table%204-11.zip",
}

ATO_YOURSUPER_URL = "https://www.ato.gov.au/api/v1/YourSuper/APRAData"


@dataclass
class FundConfig:
    id: str
    name: str
    option: str
    fund_type: str
    abn: str | None
    aum_billions: float | None
    members: int | None
    return_target: str | None
    growth_defensive_split: dict | None
    website: str | None
    notes: str | None


TRACKED_FUNDS: list[FundConfig] = [
    FundConfig(
        id="future_super",
        name="Future Super",
        option="Sustainable Growth",
        fund_type="retail",
        abn="45960194277",
        aum_billions=2.2,
        members=55_000,
        return_target="CPI + 3.0%",
        growth_defensive_split={"growth": 85, "defensive": 15},
        website="https://www.futuresuper.com.au",
        notes="Ethical screens exclude fossil fuels, banks, weapons, tobacco, gambling.",
    ),
    FundConfig(
        id="australian_super",
        name="AustralianSuper",
        option="Balanced",
        fund_type="industry",
        abn="65714394898",
        aum_billions=389,
        members=3_500_000,
        return_target="CPI + 3.8%",
        growth_defensive_split={"growth": 70, "defensive": 30},
        website="https://www.australiansuper.com",
        notes="Australia's largest super fund.",
    ),
    FundConfig(
        id="hostplus_balanced",
        name="Hostplus",
        option="Balanced",
        fund_type="industry",
        abn="68657495890",
        aum_billions=134.5,
        members=1_870_000,
        return_target="CPI + 2.5-3.0%",
        growth_defensive_split={"growth": 75, "defensive": 25},
        website="https://hostplus.com.au",
        notes="Very high alternatives allocation (~32%).",
    ),
    FundConfig(
        id="hostplus_shares_plus",
        name="Hostplus",
        option="Shares Plus",
        fund_type="industry",
        abn="68657495890",
        aum_billions=7.0,
        members=None,
        return_target=None,
        growth_defensive_split={"growth": 96, "defensive": 4},
        website="https://hostplus.com.au",
        notes="Near-100% growth assets. Zero fixed income/cash.",
    ),
    FundConfig(
        id="unisuper",
        name="UniSuper",
        option="Growth",
        fund_type="industry",
        abn="91385943850",
        aum_billions=140,
        members=680_500,
        return_target="CPI + 3.5%",
        growth_defensive_split={"growth": 80, "defensive": 20},
        website="https://www.unisuper.com.au",
        notes="Significant internal management. Originally university sector.",
    ),
    FundConfig(
        id="art_high_growth",
        name="Australian Retirement Trust",
        option="High Growth",
        fund_type="industry",
        abn="60905115063",
        aum_billions=335,
        members=2_400_000,
        return_target="CPI + 4.0%",
        growth_defensive_split={"growth": 85, "defensive": 15},
        website="https://www.australianretirementtrust.com.au",
        notes="2nd largest fund. Formed 2022 from Sunsuper + QSuper merger.",
    ),
    FundConfig(
        id="aware_super",
        name="Aware Super",
        option="High Growth",
        fund_type="industry",
        abn="53226460365",
        aum_billions=210,
        members=1_100_000,
        return_target="CPI + 4.0%",
        growth_defensive_split={"growth": 88, "defensive": 12},
        website="https://aware.com.au",
        notes="3rd largest fund. Whole-of-Fund model.",
    ),
    FundConfig(
        id="hesta_high_growth",
        name="HESTA",
        option="High Growth",
        fund_type="industry",
        abn="64971749321",
        aum_billions=100,
        members=1_085_000,
        return_target="CPI + 4.0%",
        growth_defensive_split={"growth": 82, "defensive": 18},
        website="https://www.hesta.com.au",
        notes="Health & community services focus.",
    ),
    FundConfig(
        id="rest_super",
        name="Rest Super",
        option="Growth",
        fund_type="industry",
        abn="62653671394",
        aum_billions=99,
        members=2_000_000,
        return_target="CPI + 3.0%",
        growth_defensive_split={"growth": 77, "defensive": 23},
        website="https://rest.com.au",
        notes="Originally retail sector. 37-year track record.",
    ),
    FundConfig(
        id="vanguard_super",
        name="Vanguard Super",
        option="Growth",
        fund_type="retail",
        abn="71071957202",
        aum_billions=3.2,
        members=36_374,
        return_target="CPI + 3.25%",
        growth_defensive_split={"growth": 70, "defensive": 30},
        website="https://www.vanguard.com.au",
        notes="100% passive/indexed. Lowest fees. Launched Oct 2022.",
    ),
]

FUND_ID_MAP = {f.id: f for f in TRACKED_FUNDS}
FUND_ABN_MAP: dict[str, list[FundConfig]] = {}
for _f in TRACKED_FUNDS:
    if _f.abn:
        FUND_ABN_MAP.setdefault(_f.abn, []).append(_f)
