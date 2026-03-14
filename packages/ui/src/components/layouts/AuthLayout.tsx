import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface AuthLayoutProps {
	children: ReactNode;
	className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
	return (
		<div
			className={cn(
				"relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-8",
				"bg-gradient-to-br from-deep-950 via-deep-900 to-deep-700",
				className,
			)}
		>
			{/* Twinkling stars — two offset layers */}
			<div className="auth-stars" />
			<div className="auth-stars auth-stars-2" />

			{/* Shooting stars */}
			<div className="auth-shooting-star auth-shooting-star-1" />
			<div className="auth-shooting-star auth-shooting-star-2" />
			<div className="auth-shooting-star auth-shooting-star-3" />
			<div className="auth-shooting-star auth-shooting-star-4" />

		{/* Landscape silhouettes — layered rolling hills */}
		<svg
			aria-hidden="true"
			viewBox="0 0 1440 320"
			className="auth-scene-fadein pointer-events-none absolute bottom-0 left-0 w-full"
			preserveAspectRatio="none"
		>
			<path
				d="M0,320 L0,220 Q120,140 240,190 Q360,100 480,170 Q600,80 720,150 Q840,60 960,130 Q1080,90 1200,160 Q1320,120 1440,180 L1440,320 Z"
				fill="rgba(74, 32, 101, 0.5)"
			/>
			<path
				d="M0,320 L0,250 Q180,180 360,230 Q540,170 720,220 Q900,160 1080,210 Q1260,190 1440,240 L1440,320 Z"
				fill="rgba(45, 27, 78, 0.6)"
			/>
			<path
				d="M0,320 L0,280 Q200,240 400,265 Q600,230 800,260 Q1000,235 1200,270 Q1350,260 1440,280 L1440,320 Z"
				fill="rgba(26, 5, 51, 0.7)"
			/>
		</svg>

		{/* Glowing moon */}
		<div className="auth-scene-fadein pointer-events-none absolute top-[12%] right-[10%] size-14 rounded-full bg-gradient-to-br from-accent-warm-200 to-accent-warm-400 shadow-[0_0_40px_8px_rgba(251,191,36,0.15)] sm:right-[15%] sm:size-16" />

			{children}
		</div>
	);
}
