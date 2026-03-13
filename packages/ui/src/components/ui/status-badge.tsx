import { type VariantProps, cva } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const statusBadgeVariants = cva(
	"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
	{
		variants: {
			status: {
				online: "bg-success/10 text-success",
				offline: "bg-muted text-muted-foreground",
				error: "bg-destructive/10 text-destructive",
				warning: "bg-accent-warm-400/10 text-accent-warm-500",
				loading: "bg-primary/10 text-primary",
			},
		},
		defaultVariants: {
			status: "offline",
		},
	},
);

interface StatusBadgeProps
	extends HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof statusBadgeVariants> {
	pulse?: boolean;
}

function StatusBadge({
	className,
	status,
	pulse = false,
	children,
	...props
}: StatusBadgeProps) {
	return (
		<span
			data-slot="status-badge"
			className={cn(statusBadgeVariants({ status }), className)}
			{...props}
		>
			<span className="relative flex size-2">
				{pulse && (status === "online" || status === "loading") && (
					<span
						className={cn(
							"absolute inline-flex size-full animate-ping rounded-full opacity-75",
							status === "online" && "bg-success",
							status === "loading" && "bg-primary",
						)}
					/>
				)}
				<span
					className={cn(
						"relative inline-flex size-2 rounded-full",
						status === "online" && "bg-success",
						status === "offline" && "bg-muted-foreground",
						status === "error" && "bg-destructive",
						status === "warning" && "bg-accent-warm-500",
						status === "loading" && "bg-primary",
					)}
				/>
			</span>
			{children}
		</span>
	);
}

export { StatusBadge, statusBadgeVariants };
export type { StatusBadgeProps };
