import artHighGrowth from "../../../../research/super-research/research/fund_papers/art_high_growth_research_paper.md?raw";
import australianSuper from "../../../../research/super-research/research/fund_papers/australian_super_research_paper.md?raw";
import awareSuper from "../../../../research/super-research/research/fund_papers/aware_super_research_paper.md?raw";
import futureSuper from "../../../../research/super-research/research/fund_papers/future_super_research_paper.md?raw";
import hestaHighGrowth from "../../../../research/super-research/research/fund_papers/hesta_high_growth_research_paper.md?raw";
import hostplusBalanced from "../../../../research/super-research/research/fund_papers/hostplus_balanced_research_paper.md?raw";
import hostplusSharesPlus from "../../../../research/super-research/research/fund_papers/hostplus_shares_plus_research_paper.md?raw";
import restSuper from "../../../../research/super-research/research/fund_papers/rest_super_research_paper.md?raw";
import unisuper from "../../../../research/super-research/research/fund_papers/unisuper_research_paper.md?raw";
import vanguardSuper from "../../../../research/super-research/research/fund_papers/vanguard_super_research_paper.md?raw";
import masterComparison from "../../../../research/super-research/research/master_comparison.md?raw";

export interface FundPaper {
	fundId: string;
	title: string;
	content: string;
}

export const FUND_PAPERS: FundPaper[] = [
	{ fundId: "_overview", title: "Master Comparison", content: masterComparison },
	{ fundId: "future_super", title: "Future Super — Sustainable Growth", content: futureSuper },
	{ fundId: "australian_super", title: "AustralianSuper — Balanced", content: australianSuper },
	{ fundId: "hostplus_balanced", title: "Hostplus — Balanced", content: hostplusBalanced },
	{ fundId: "hostplus_shares_plus", title: "Hostplus — Shares Plus", content: hostplusSharesPlus },
	{ fundId: "art_high_growth", title: "ART — High Growth", content: artHighGrowth },
	{ fundId: "aware_super", title: "Aware Super — High Growth", content: awareSuper },
	{ fundId: "hesta_high_growth", title: "HESTA — High Growth", content: hestaHighGrowth },
	{ fundId: "unisuper", title: "UniSuper — Growth", content: unisuper },
	{ fundId: "rest_super", title: "Rest Super — Growth", content: restSuper },
	{ fundId: "vanguard_super", title: "Vanguard Super — Growth", content: vanguardSuper },
];
