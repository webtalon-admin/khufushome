import { useEffect, useState } from "react";

/**
 * Tracks whether a CSS media query matches.
 * Falls back to `false` during SSR or initial paint.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		const mql = window.matchMedia(query);
		setMatches(mql.matches);

		const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, [query]);

	return matches;
}

export const breakpoints = {
	sm: "(min-width: 640px)",
	md: "(min-width: 768px)",
	lg: "(min-width: 1024px)",
	xl: "(min-width: 1280px)",
	"2xl": "(min-width: 1536px)",
} as const;

export function useIsMobile(): boolean {
	return !useMediaQuery(breakpoints.md);
}
