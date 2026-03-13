import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface AuthLayoutProps {
	children: ReactNode;
	className?: string;
}

/**
 * Full-screen centered layout with the deep purple gradient background.
 * Used for login and other unauthenticated pages.
 *
 * The consuming page can layer decorations (e.g. animated stars)
 * as siblings to the content since the wrapper is `position: relative`.
 */
export function AuthLayout({ children, className }: AuthLayoutProps) {
	return (
		<div
			className={cn(
				"relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-8",
				"bg-gradient-to-br from-deep-950 via-deep-900 to-deep-700",
				className,
			)}
		>
			{children}
		</div>
	);
}
