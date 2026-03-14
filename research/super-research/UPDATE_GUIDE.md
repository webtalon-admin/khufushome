# Six-Monthly Update Guide

> **Update schedule:** Every March and September
> **Last updated:** March 2026
> **Next update due:** September 2026

## Pre-Update Checklist

- [ ] Check the date -- is it March or September?
- [ ] Open the project: `cd super-research`
- [ ] Make sure dependencies are up to date: `pip install -r requirements.txt`

## Step 1: Update Your Personal Data

Edit `config/personal.yaml`:

- [ ] Update `age` (increment by 1 if your birthday has passed)
- [ ] Update `current_balance` with your latest Future Super balance
- [ ] Update `annual_salary` if it has changed
- [ ] Update `sg_rate` if the Super Guarantee rate has changed
- [ ] Add a new entry to `contribution_history` with today's date and balance:

```yaml
    - date: "2026-09-15"
      annual_salary: 180000
      balance_at_date: 125000  # your actual balance
```

## Step 2: Update Fund Return Data

### 2a. Annual Returns (`data/returns/annual_returns.csv`)

After each financial year ends (July), add new rows for each fund's FY return. Sources:

| Fund | Where to find FY returns |
|------|-------------------------|
| AustralianSuper | australiansuper.com/why-choose-us/our-performance |
| Hostplus | hostplus.com.au > Investment Performance |
| UniSuper | unisuper.com.au/investments/investment-options-and-performance |
| ART | australianretirementtrust.com.au/investments/high-growth |
| Aware Super | aware.com.au/investments/investment-performance |
| HESTA | hesta.com.au/super-performance |
| Rest Super | rest.com.au > Investment Performance |
| Vanguard | vanguard.com.au > Super > Performance |
| Future Super | futuresuper.com.au/performance-and-returns |

Add rows in the format:
```csv
fund_id,fy,return_pct,return_type,source
australian_super,FY2026,9.50,after_investment_fees,AustralianSuper website
```

### 2b. Annualised Returns (`data/returns/annualised_returns.csv`)

Update the annualised return figures (1yr, 3yr, 5yr, 10yr) from fund websites or InvestSMART/Morningstar. Replace old rows for each fund with current figures.

## Step 3: Update Fee Data

Check each fund's PDS or fees page for any changes. Edit `data/fees/fee_structures.csv` if fees have changed.

Common triggers for fee changes:
- New financial year (July) -- many funds update fees
- Fund mergers
- PDS updates

## Step 4: Update Asset Allocations

Check each fund's strategic asset allocation from their PDS or investment option page. Edit `data/allocations/asset_allocations.csv` if allocations have changed.

## Step 5: Update Australian Benchmarks

Check for updated ATO/ASFA median balance data. This is usually released annually.

- Source: ATO Taxation Statistics (data.gov.au) or ASFA reports
- Edit `data/benchmarks/au_median_balance_by_age.csv`

## Step 6: Update Fund Research Papers

For each fund in `research/fund_papers/`, review and update:

- [ ] Any changes to investment philosophy or strategy
- [ ] New performance data
- [ ] Fee changes
- [ ] Holdings changes (if disclosed)
- [ ] Any mergers, name changes, or structural changes

Or ask the AI research agent to regenerate papers with updated data.

## Step 7: Update Fund Config (if needed)

Check `config/funds.yaml` for any changes to:
- Fund AUM (assets under management)
- Member numbers
- Return targets
- New funds to add / funds to remove from comparison

## Step 8: Test the App

```bash
streamlit run app.py
```

- [ ] Overview page loads correctly with updated benchmark comparison
- [ ] Historical Performance shows updated what-if chart
- [ ] Fee Impact reflects any fee changes
- [ ] Projections calculate correctly
- [ ] Fund Research Papers render properly

## Step 9: Record the Update

Update the following:
- [ ] `plan.md` -- update the "Last updated" date
- [ ] This file -- update the "Last updated" date at the top
- [ ] Add a note to `research/sources/update_log.md` (create if needed) with what changed

---

## Quick Reference: Data File Locations

| Data | File | Update Frequency |
|------|------|-----------------|
| Your balance/salary | `config/personal.yaml` | Every 6 months |
| Year-by-year returns | `data/returns/annual_returns.csv` | After each FY (July) |
| Annualised returns | `data/returns/annualised_returns.csv` | Every 6 months |
| Asset allocations | `data/allocations/asset_allocations.csv` | Annually or when PDS updates |
| Fee structures | `data/fees/fee_structures.csv` | Annually or when PDS updates |
| AU benchmarks | `data/benchmarks/au_median_balance_by_age.csv` | Annually (when ATO releases new data) |
| Fund metadata | `config/funds.yaml` | As needed (mergers, new funds) |
| Research papers | `research/fund_papers/*.md` | Every 6 months |

## Using the AI Research Agent

When it's time for an update, open a new chat with the AI agent and say:

> "It's time for the six-monthly super research update. Here's my latest balance: $X. Please update all data files, research papers, and verify the app runs correctly."

The agent will:
1. Research current fund performance data
2. Update all CSV files
3. Regenerate research papers
4. Test the app
5. Report any significant changes (e.g., a fund overtaking another in rankings)
