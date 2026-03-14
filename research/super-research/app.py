import streamlit as st
import pandas as pd

from src.data_loader import (
    load_funds_dict,
    load_personal,
    load_annual_returns,
    load_annualised_returns,
    load_asset_allocations,
    load_fee_structures,
    load_fee_models,
    load_au_benchmarks,
    get_benchmark_for_age,
    get_fund_label,
)
from src.analysis import (
    project_balance_for_fund,
    personal_what_if,
    historical_what_if,
    fee_drag_over_time,
    scenario_projections,
)
from src.charts import (
    annualised_returns_bar,
    annual_returns_line,
    fee_comparison_bar,
    asset_allocation_stacked_bar,
    projection_line,
    fee_drag_line,
    scenario_fan,
    historical_what_if_line,
    personal_what_if_chart,
)

st.set_page_config(
    page_title="Super Fund Comparison",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)


@st.cache_data
def load_all_data():
    funds = load_funds_dict()
    personal = load_personal()
    annual_ret = load_annual_returns()
    annualised_ret = load_annualised_returns()
    allocations = load_asset_allocations()
    fees_df = load_fee_structures()
    fee_models = load_fee_models()
    return funds, personal, annual_ret, annualised_ret, allocations, fees_df, fee_models


funds, personal, annual_returns_df, annualised_returns_df, allocations_df, fees_df, fee_models = load_all_data()
au_benchmarks = load_au_benchmarks()
my_benchmark = get_benchmark_for_age(personal.age, au_benchmarks)

ALL_FUND_IDS = list(funds.keys())
ALL_FUND_LABELS = {fid: get_fund_label(fid, funds) for fid in ALL_FUND_IDS}

# --- Sidebar ---
st.sidebar.title("Super Research Tool")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Navigate",
    [
        "Overview",
        "Historical Performance",
        "Asset Allocation",
        "Fee Impact",
        "Projections",
        "Fund Research Papers",
    ],
)

st.sidebar.markdown("---")
st.sidebar.markdown("**Your Profile**")
st.sidebar.markdown(f"Current fund: **{get_fund_label(personal.current_fund, funds)}**")
if personal.current_balance > 0:
    st.sidebar.markdown(f"Balance: **${personal.current_balance:,.0f}**")
    st.sidebar.markdown(f"Annual contribution: **${personal.total_annual_contribution:,.0f}**")
    st.sidebar.markdown(f"Years to retirement: **{personal.years_to_retirement}**")
else:
    st.sidebar.warning("Update config/personal.yaml with your details for personalised analysis.")

selected_funds = st.sidebar.multiselect(
    "Funds to compare",
    options=ALL_FUND_IDS,
    default=ALL_FUND_IDS,
    format_func=lambda x: ALL_FUND_LABELS[x],
)

# =============================================================================
# PAGE: Overview
# =============================================================================
if page == "Overview":
    st.title("Superannuation Fund Comparison")
    st.markdown("Comparing **Future Super** against the top-performing Australian super funds.")

    # --- Australian Benchmark Comparison ---
    if my_benchmark and personal.current_balance > 0:
        st.markdown("### How You Compare to Other Australians")
        male_med = my_benchmark.get("male_median", 0)
        male_avg = my_benchmark.get("male_average")
        age_group = my_benchmark.get("age_group", "")

        col_a, col_b, col_c = st.columns(3)
        with col_a:
            st.metric(
                label="Your Balance",
                value=f"${personal.current_balance:,.0f}",
            )
        with col_b:
            diff_med = personal.current_balance - male_med
            st.metric(
                label=f"Median (Male {age_group})",
                value=f"${male_med:,.0f}",
                delta=f"You're ${abs(diff_med):,.0f} {'above' if diff_med >= 0 else 'below'}",
                delta_color="normal" if diff_med >= 0 else "inverse",
            )
        with col_c:
            if male_avg and not pd.isna(male_avg):
                diff_avg = personal.current_balance - male_avg
                st.metric(
                    label=f"Average (Male {age_group})",
                    value=f"${male_avg:,.0f}",
                    delta=f"You're ${abs(diff_avg):,.0f} {'above' if diff_avg >= 0 else 'below'}",
                    delta_color="normal" if diff_avg >= 0 else "inverse",
                )

        bench_df = au_benchmarks[["age_group", "male_median", "female_median"]].copy()
        bench_df["your_balance"] = None
        user_row = bench_df[
            (au_benchmarks["age_min"] <= personal.age) & (au_benchmarks["age_max"] >= personal.age)
        ].index
        if len(user_row) > 0:
            bench_df.loc[user_row[0], "your_balance"] = personal.current_balance

        import plotly.graph_objects as go
        fig_bench = go.Figure()
        fig_bench.add_trace(go.Bar(
            x=bench_df["age_group"], y=bench_df["male_median"],
            name="Male Median", marker_color="#2E86AB",
        ))
        fig_bench.add_trace(go.Bar(
            x=bench_df["age_group"], y=bench_df["female_median"],
            name="Female Median", marker_color="#A23B72",
        ))
        if bench_df["your_balance"].notna().any():
            fig_bench.add_trace(go.Bar(
                x=bench_df["age_group"], y=bench_df["your_balance"],
                name="YOU", marker_color="#E94F37",
            ))
        fig_bench.update_layout(
            title="Median Super Balance by Age Group (ATO 2021-22) — Where You Sit",
            xaxis_title="Age Group",
            yaxis_title="Balance ($)",
            template="plotly_white",
            barmode="group",
            height=400,
            yaxis_tickprefix="$",
            yaxis_tickformat=",",
        )
        st.plotly_chart(fig_bench, use_container_width=True)
        st.caption(
            f"Source: ATO Taxation Statistics 2021-22, ASFA Oct 2025. "
            f"Your balance of ${personal.current_balance:,.0f} is "
            f"**{((personal.current_balance / male_med) - 1) * 100:.0f}% above** the male median "
            f"for your age group ({age_group}). "
            f"Note: these benchmarks include ALL fund types and contribution levels."
        )

        st.markdown("---")

    st.markdown("### Fund Summary")
    summary_rows = []
    for fid in selected_funds:
        f = funds[fid]
        fee = fee_models.get(fid)
        ten_yr = annualised_returns_df[
            (annualised_returns_df["fund_id"] == fid) & (annualised_returns_df["period"] == "10yr")
        ]
        ten_yr_val = f"{ten_yr['return_pct'].iloc[0]:.2f}%" if len(ten_yr) > 0 else "N/A"
        summary_rows.append({
            "Fund": get_fund_label(fid, funds),
            "Type": f.type.title(),
            "AUM ($B)": f.aum_billions,
            "10yr Return (p.a.)": ten_yr_val,
            "Fees on $50k": f"${fee.total_on_50k:,.0f}" if fee and fee.total_on_50k else "N/A",
            "Return Target": f.return_target,
            "Growth/Defensive": f"{f.growth_defensive_split[0]}/{f.growth_defensive_split[1]}",
        })

    st.dataframe(pd.DataFrame(summary_rows), use_container_width=True, hide_index=True)

    st.markdown("### Key Takeaway")
    st.info(
        "Future Super charges the highest fees ($700/yr on $50k) and has delivered below-median "
        "returns historically. Switching to a top-performing industry fund like ART High Growth or "
        "AustralianSuper Balanced could save $150,000-$250,000+ over your working life."
    )

    st.markdown("---")
    st.caption(
        "Past performance is not a reliable indicator of future performance. "
        "This is personal research, not financial advice."
    )


# =============================================================================
# PAGE: Historical Performance
# =============================================================================
elif page == "Historical Performance":
    st.title("Historical Performance")

    # --- Personal What-If (top of page, most important) ---
    if personal.current_balance > 0 and len(personal.contribution_history) >= 2:
        st.markdown("### Your Super: Actual vs What-If")
        st.markdown(
            "Your **actual Future Super balance** (solid red line) compared to what you "
            "would have had in each alternative fund (dotted lines). Same contributions, "
            "different returns."
        )

        whatif_funds = [f for f in selected_funds if f != personal.current_fund]
        whatif_df = personal_what_if(
            profile=personal,
            annual_returns=annual_returns_df,
            fund_ids=whatif_funds,
            fees=fee_models,
        )
        if not whatif_df.empty:
            fig_personal = personal_what_if_chart(
                whatif_df, funds, current_fund_id=personal.current_fund,
            )
            st.plotly_chart(fig_personal, use_container_width=True)

            st.markdown("#### Balance Comparison at Each Snapshot")
            display_df = whatif_df.copy()
            display_df["date"] = pd.to_datetime(display_df["date"]).dt.strftime("%b %Y")
            rename_map = {"date": "Date", "actual": f"Future Super (Actual)"}
            for fid in whatif_funds:
                rename_map[fid] = get_fund_label(fid, funds)
            display_df = display_df.rename(columns=rename_map)
            for col in display_df.columns[1:]:
                display_df[col] = display_df[col].apply(lambda x: f"${x:,.0f}")
            st.dataframe(display_df, use_container_width=True, hide_index=True)

            final_row = whatif_df.iloc[-1]
            st.markdown("#### Opportunity Cost Summary")
            opp_rows = []
            for fid in whatif_funds:
                alt_bal = final_row[fid]
                diff = alt_bal - final_row["actual"]
                opp_rows.append({
                    "Fund": get_fund_label(fid, funds),
                    "Estimated Balance Today": f"${alt_bal:,.0f}",
                    "vs Your Actual": f"{'+ ' if diff >= 0 else ''}{diff:,.0f}",
                })
            opp_df = pd.DataFrame(opp_rows).sort_values("vs Your Actual", ascending=False)
            st.dataframe(opp_df, use_container_width=True, hide_index=True)

        st.markdown("---")

    # --- Annualised Returns ---
    st.markdown("### Annualised Returns")
    periods = st.multiselect(
        "Select periods",
        options=["1yr", "3yr", "5yr", "7yr", "10yr"],
        default=["1yr", "3yr", "5yr", "10yr"],
    )
    filtered_annualised = annualised_returns_df[annualised_returns_df["fund_id"].isin(selected_funds)]
    fig_ann = annualised_returns_bar(filtered_annualised, funds, periods)
    st.plotly_chart(fig_ann, use_container_width=True)

    # --- Year-by-Year Returns ---
    st.markdown("### Year-by-Year Returns")
    filtered_annual = annual_returns_df[annual_returns_df["fund_id"].isin(selected_funds)]
    funds_with_annual = filtered_annual["fund_id"].unique().tolist()
    if funds_with_annual:
        fig_yby = annual_returns_line(filtered_annual, funds, funds_with_annual)
        st.plotly_chart(fig_yby, use_container_width=True)
    else:
        st.warning("No year-by-year data available for selected funds.")


# =============================================================================
# PAGE: Asset Allocation
# =============================================================================
elif page == "Asset Allocation":
    st.title("Asset Allocation")
    st.markdown("What each fund actually invests in.")

    filtered_alloc = allocations_df[allocations_df["fund_id"].isin(selected_funds)]
    fig_alloc = asset_allocation_stacked_bar(filtered_alloc, funds)
    st.plotly_chart(fig_alloc, use_container_width=True)

    st.markdown("### Growth vs Defensive Split")
    gd_rows = []
    for fid in selected_funds:
        f = funds[fid]
        gd_rows.append({
            "Fund": get_fund_label(fid, funds),
            "Growth %": f.growth_defensive_split[0],
            "Defensive %": f.growth_defensive_split[1],
        })
    st.dataframe(pd.DataFrame(gd_rows), use_container_width=True, hide_index=True)

    st.markdown("### Detailed Allocation Table")
    display_alloc = filtered_alloc.copy()
    display_alloc["Fund"] = display_alloc["fund_id"].map(lambda x: get_fund_label(x, funds))
    cols_to_show = ["Fund", "australian_equities", "international_equities", "property",
                    "infrastructure", "private_equity", "alternatives", "fixed_income", "cash"]
    cols_present = [c for c in cols_to_show if c in display_alloc.columns]
    st.dataframe(display_alloc[cols_present], use_container_width=True, hide_index=True)


# =============================================================================
# PAGE: Fee Impact
# =============================================================================
elif page == "Fee Impact":
    st.title("Fee Impact Analysis")

    filtered_fees = fees_df[fees_df["fund_id"].isin(selected_funds)]

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("### Fees on $50,000 Balance")
        fig_50k = fee_comparison_bar(filtered_fees, funds, "total_on_50k")
        st.plotly_chart(fig_50k, use_container_width=True)
    with col2:
        st.markdown("### Fees on $100,000 Balance")
        fig_100k = fee_comparison_bar(filtered_fees, funds, "total_on_100k")
        st.plotly_chart(fig_100k, use_container_width=True)

    st.markdown("### Fee Calculator")
    calc_balance = st.slider("Your balance ($)", 10_000, 500_000, 100_000, 10_000)
    fee_rows = []
    for fid in selected_funds:
        if fid in fee_models:
            fee = fee_models[fid]
            total = fee.calculate_total_fee(calc_balance)
            fee_rows.append({
                "Fund": get_fund_label(fid, funds),
                "Annual Fee": f"${total:,.0f}",
                "Fee as % of Balance": f"{(total / calc_balance) * 100:.2f}%",
            })
    st.dataframe(pd.DataFrame(fee_rows), use_container_width=True, hide_index=True)

    st.markdown("### Cumulative Fee Drag Over Time")
    drag_years = st.slider("Projection years", 5, 40, 30, 5)
    assumed_return = st.slider("Assumed annual return (%)", 4.0, 12.0, 8.0, 0.5)
    selected_fee_models = {fid: fee_models[fid] for fid in selected_funds if fid in fee_models}
    drag_df = fee_drag_over_time(calc_balance, assumed_return, selected_fee_models, drag_years)
    fig_drag = fee_drag_line(drag_df, funds)
    st.plotly_chart(fig_drag, use_container_width=True)


# =============================================================================
# PAGE: Projections
# =============================================================================
elif page == "Projections":
    st.title("Balance Projections")

    if personal.current_balance <= 0:
        st.warning(
            "Please update `config/personal.yaml` with your current balance, salary, and "
            "other details to enable personalised projections."
        )
        st.stop()

    st.markdown(f"**Starting balance:** ${personal.current_balance:,.0f}")
    st.markdown(f"**Annual contribution:** ${personal.total_annual_contribution:,.0f}")

    proj_years = st.slider("Years to project", 5, 40, personal.years_to_retirement, 1)
    assumed_ret = st.slider("Assumed annual return (%)", 4.0, 12.0, 8.0, 0.5)

    projections = {}
    for fid in selected_funds:
        if fid in fee_models:
            proj = project_balance_for_fund(personal, fee_models[fid], assumed_ret, proj_years)
            projections[fid] = proj

    if projections:
        fig_proj = projection_line(projections, funds)
        st.plotly_chart(fig_proj, use_container_width=True)

        st.markdown("### Final Balances")
        final_rows = []
        for fid, proj_df in projections.items():
            final_bal = proj_df["balance"].iloc[-1]
            total_fees = proj_df["fee"].sum()
            final_rows.append({
                "Fund": get_fund_label(fid, funds),
                "Final Balance": f"${final_bal:,.0f}",
                "Total Fees Paid": f"${total_fees:,.0f}",
            })
        final_df = pd.DataFrame(final_rows).sort_values("Final Balance", ascending=False)
        st.dataframe(final_df, use_container_width=True, hide_index=True)

    st.markdown("### Scenario Analysis")
    scenario_fund = st.selectbox(
        "Select fund for scenarios",
        options=[f for f in selected_funds if f in fee_models],
        format_func=lambda x: get_fund_label(x, funds),
    )
    if scenario_fund:
        scenarios = scenario_projections(personal, fee_models[scenario_fund], proj_years)
        fig_scenario = scenario_fan(scenarios, get_fund_label(scenario_fund, funds))
        st.plotly_chart(fig_scenario, use_container_width=True)


# =============================================================================
# PAGE: Fund Research Papers
# =============================================================================
elif page == "Fund Research Papers":
    st.title("Fund Research Papers")
    st.markdown("Detailed research for each fund under comparison. Select a fund to view its full report.")

    from pathlib import Path

    papers_dir = Path(__file__).parent / "research" / "fund_papers"

    paper_fund = st.selectbox(
        "Select fund",
        options=selected_funds,
        format_func=lambda x: get_fund_label(x, funds),
    )

    if paper_fund:
        paper_path = papers_dir / f"{paper_fund}_research_paper.md"
        if paper_path.exists():
            st.markdown(paper_path.read_text(encoding="utf-8"))
        else:
            st.info(f"Research paper not yet generated for {get_fund_label(paper_fund, funds)}.")

        st.markdown("---")
        st.download_button(
            label="Download this paper as Markdown",
            data=paper_path.read_text(encoding="utf-8") if paper_path.exists() else "",
            file_name=f"{paper_fund}_research_paper.md",
            mime="text/markdown",
            disabled=not paper_path.exists(),
        )
