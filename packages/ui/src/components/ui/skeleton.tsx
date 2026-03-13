import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-muted", className)}
			{...props}
		/>
	);
}

function SkeletonText({
	lines = 3,
	className,
	...props
}: HTMLAttributes<HTMLDivElement> & { lines?: number }) {
	return (
		<div
			data-slot="skeleton-text"
			className={cn("space-y-2", className)}
			{...props}
		>
		{Array.from({ length: lines }, (_, i) => (
			<Skeleton
				key={`line-${i.toString()}`}
				className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
			/>
		))}
		</div>
	);
}

function SkeletonCard({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="skeleton-card"
			className={cn(
				"rounded-xl border border-border bg-card p-6 shadow-sm",
				className,
			)}
			{...props}
		>
			<div className="flex items-center gap-3">
				<Skeleton className="size-10 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-3 w-1/2" />
				</div>
			</div>
			<div className="mt-4 space-y-2">
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-2/3" />
			</div>
		</div>
	);
}

function SkeletonTableRows({
	rows = 5,
	columns = 4,
	className,
	...props
}: HTMLAttributes<HTMLDivElement> & { rows?: number; columns?: number }) {
	return (
		<div
			data-slot="skeleton-table-rows"
			className={cn("space-y-3", className)}
			{...props}
		>
		{Array.from({ length: rows }, (_, r) => (
			<div key={`row-${r.toString()}`} className="flex items-center gap-4">
				{Array.from({ length: columns }, (_, c) => (
					<Skeleton
						key={`col-${c.toString()}`}
						className={cn("h-4 flex-1", c === 0 && "max-w-[120px]")}
					/>
				))}
				</div>
			))}
		</div>
	);
}

function SkeletonPage({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="skeleton-page"
			className={cn("space-y-6", className)}
			{...props}
		>
			<div className="space-y-2">
				<Skeleton className="h-7 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{Array.from({ length: 4 }, (_, i) => (
				<div
					key={`stat-${i.toString()}`}
					className="rounded-xl border border-border bg-card p-6 shadow-sm"
				>
						<Skeleton className="mb-2 h-3 w-16" />
						<Skeleton className="h-7 w-24" />
					</div>
				))}
			</div>
			<SkeletonCard />
		</div>
	);
}

export {
	Skeleton,
	SkeletonText,
	SkeletonCard,
	SkeletonTableRows,
	SkeletonPage,
};
