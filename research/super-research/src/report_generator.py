from __future__ import annotations

from pathlib import Path

from jinja2 import Template

from .models import FundConfig

FUND_PAPER_TEMPLATE = Template("""\
# {{ fund.name }} — {{ fund.option }}

> **Fund Type:** {{ fund.type | title }}
> **AUM:** ${{ "%.1f" | format(fund.aum_billions) }}B
> **Members:** {{ "{:,}".format(fund.members) if fund.members else "N/A" }}
> **Return Target:** {{ fund.return_target }} over {{ fund.target_horizon_years }} years
> **Growth/Defensive Split:** {{ fund.growth_defensive_split[0] }}/{{ fund.growth_defensive_split[1] }}

---

## Investment Philosophy

{{ notes }}

---

## Historical Performance

### Annualised Returns

| Period | Return (p.a.) |
|--------|--------------|
{% for row in annualised_returns %}\
| {{ row.period }} | {{ "%.2f" | format(row.return_pct) }}% |
{% endfor %}

### Year-by-Year Returns

| Financial Year | Return |
|---------------|--------|
{% for row in annual_returns %}\
| {{ row.fy }} | {{ "%.2f" | format(row.return_pct) }}% |
{% endfor %}

---

## Asset Allocation

| Asset Class | Allocation |
|------------|-----------|
{% for key, val in allocation.items() %}\
| {{ key | replace("_", " ") | title }} | {{ "%.1f" | format(val) }}% |
{% endfor %}

---

## Fee Structure

| Component | Amount |
|-----------|--------|
| Admin Fee (flat) | ${{ "%.0f" | format(fees.admin_fee_flat) }}/year |
| Admin Fee (%) | {{ "%.2f" | format(fees.admin_fee_pct) }}% p.a. |
| Investment Fee | {{ "%.2f" | format(fees.investment_fee_pct) }}% p.a. |
{% if fees.performance_fee_pct %}\
| Performance Fee | {{ "%.2f" | format(fees.performance_fee_pct) }}% p.a. |
{% endif %}\
{% if fees.transaction_cost_pct %}\
| Transaction Costs | {{ "%.2f" | format(fees.transaction_cost_pct) }}% p.a. |
{% endif %}\
| **Total on $50k** | **${{ "%.0f" | format(fees.total_on_50k) }}** |
| **Total on $100k** | **${{ "%.0f" | format(fees.total_on_100k) }}** |

---

## Key Notes

{{ fund.notes }}

---

## Sources

{{ sources }}

---

*Report generated for personal research purposes. Past performance is not a reliable indicator of future performance. This is not financial advice.*
""")


def generate_fund_paper(
    fund: FundConfig,
    annualised_returns: list[dict],
    annual_returns: list[dict],
    allocation: dict[str, float],
    fees,
    notes: str = "",
    sources: str = "",
    output_dir: Path | None = None,
) -> str:
    content = FUND_PAPER_TEMPLATE.render(
        fund=fund,
        annualised_returns=annualised_returns,
        annual_returns=annual_returns,
        allocation=allocation,
        fees=fees,
        notes=notes or fund.notes,
        sources=sources or f"See {fund.website}",
    )

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{fund.id}_research_paper.md"
        (output_dir / filename).write_text(content, encoding="utf-8")

    return content
