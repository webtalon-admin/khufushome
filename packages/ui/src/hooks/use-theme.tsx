import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "khufushome-theme";

interface ThemeContextValue {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function getStoredTheme(): Theme {
	if (typeof window === "undefined") return "system";
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark" || stored === "system")
		return stored;
	return "system";
}

function applyTheme(resolved: "light" | "dark") {
	const root = document.documentElement;
	root.classList.toggle("dark", resolved === "dark");
}

export interface ThemeProviderProps {
	children: ReactNode;
	defaultTheme?: Theme;
}

export function ThemeProvider({
	children,
	defaultTheme,
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(
		() => defaultTheme ?? getStoredTheme(),
	);
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
		const t = defaultTheme ?? getStoredTheme();
		return t === "system" ? getSystemTheme() : t;
	});

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		localStorage.setItem(STORAGE_KEY, next);
	}, []);

	useEffect(() => {
		const resolved = theme === "system" ? getSystemTheme() : theme;
		setResolvedTheme(resolved);
		applyTheme(resolved);
	}, [theme]);

	useEffect(() => {
		if (theme !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => {
			const resolved = e.matches ? "dark" : "light";
			setResolvedTheme(resolved);
			applyTheme(resolved);
		};
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [theme]);

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx)
		throw new Error("useTheme must be used within a <ThemeProvider>");
	return ctx;
}
