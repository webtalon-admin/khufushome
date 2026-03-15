import { Card, CardContent } from "@khufushome/ui";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SuperNav } from "../../../components/super/SuperNav";
import { FUND_PAPERS } from "../../../lib/fund-papers";

export const Route = createFileRoute("/super/research/papers")({
	component: FundPapersPage,
});

function FundPapersPage() {
	const [selectedIdx, setSelectedIdx] = useState(0);
	const paper = FUND_PAPERS[selectedIdx]!;

	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Fund Research Papers
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					In-depth research on each tracked super fund, including performance,
					fees, asset allocation, and suitability analysis.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[260px_1fr]">
				{/* Fund Selector Sidebar */}
				<Card className="h-fit lg:sticky lg:top-4">
					<CardContent className="p-3">
						<nav className="space-y-0.5">
							{FUND_PAPERS.map((p, idx) => (
								<button
									key={p.fundId}
									type="button"
									onClick={() => setSelectedIdx(idx)}
									className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
										idx === selectedIdx
											? "bg-primary text-primary-foreground font-medium shadow-sm"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
								>
									<BookOpen className="size-3.5 shrink-0" />
									<span className="truncate">{p.title}</span>
								</button>
							))}
						</nav>
					</CardContent>
				</Card>

				{/* Paper Content */}
				<Card>
					<CardContent className="p-6 lg:p-8">
						<div className="flex items-center justify-between mb-6">
							<button
								type="button"
								disabled={selectedIdx === 0}
								onClick={() => setSelectedIdx((i) => i - 1)}
								className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-30 disabled:pointer-events-none"
							>
								<ChevronLeft className="size-3.5" />
								Previous
							</button>
							<span className="text-xs text-muted-foreground tabular-nums">
								{selectedIdx + 1} / {FUND_PAPERS.length}
							</span>
							<button
								type="button"
								disabled={selectedIdx === FUND_PAPERS.length - 1}
								onClick={() => setSelectedIdx((i) => i + 1)}
								className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-30 disabled:pointer-events-none"
							>
								Next
								<ChevronRight className="size-3.5" />
							</button>
						</div>

						<article className="fund-paper prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-h1:text-2xl prose-h2:text-lg prose-h3:text-base prose-table:text-xs prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-td:px-3 prose-td:py-1.5 prose-td:border-t prose-td:border-border prose-blockquote:text-muted-foreground prose-blockquote:border-primary/40 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-md prose-blockquote:py-2 prose-blockquote:px-4 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-hr:border-border prose-strong:text-foreground prose-li:marker:text-primary/60">
							<Markdown remarkPlugins={[remarkGfm]}>
								{paper.content}
							</Markdown>
						</article>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
