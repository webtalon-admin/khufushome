import { Menu, X } from "lucide-react";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { cn } from "../../lib/utils";

interface AppShellContextValue {
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
	toggle: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
	const ctx = useContext(AppShellContext);
	if (!ctx) throw new Error("useAppShell must be used within <AppShell>");
	return ctx;
}

export interface AppShellProps {
	children: ReactNode;
	sidebar: ReactNode;
	headerLeft?: ReactNode;
	headerRight?: ReactNode;
	className?: string;
}

export function AppShell({
	children,
	sidebar,
	headerLeft,
	headerRight,
	className,
}: AppShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const toggle = useCallback(() => setSidebarOpen((p) => !p), []);

	useEffect(() => {
		if (!sidebarOpen) return;
		const mq = window.matchMedia("(min-width: 768px)");
		const handleChange = (e: MediaQueryListEvent) => {
			if (e.matches) setSidebarOpen(false);
		};
		mq.addEventListener("change", handleChange);
		return () => mq.removeEventListener("change", handleChange);
	}, [sidebarOpen]);

	useEffect(() => {
		if (sidebarOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [sidebarOpen]);

	return (
		<AppShellContext.Provider value={{ sidebarOpen, setSidebarOpen, toggle }}>
			<div className={cn("relative min-h-svh bg-background", className)}>
				{/* Mobile backdrop */}
				{sidebarOpen && (
					<button
						type="button"
						className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
						onClick={() => setSidebarOpen(false)}
						aria-label="Close sidebar"
					/>
				)}

				{/* Sidebar */}
				<aside
					className={cn(
						"fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar",
						"transition-transform duration-200 ease-in-out",
						"md:translate-x-0",
						sidebarOpen ? "translate-x-0" : "-translate-x-full",
					)}
				>
					{/* Mobile close button */}
					<div className="flex items-center justify-end p-2 md:hidden">
						<button
							type="button"
							onClick={() => setSidebarOpen(false)}
							className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
						>
							<X className="size-5" />
							<span className="sr-only">Close sidebar</span>
						</button>
					</div>

					{sidebar}
				</aside>

				{/* Main area — offset by sidebar width on desktop */}
				<div className="flex min-h-svh flex-col md:pl-64">
					{/* Header */}
					<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
						<button
							type="button"
							onClick={toggle}
							className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
						>
							<Menu className="size-5" />
							<span className="sr-only">Open sidebar</span>
						</button>

						{headerLeft && (
							<div className="flex items-center gap-2">{headerLeft}</div>
						)}

						<div className="ml-auto flex items-center gap-2">
							{headerRight}
						</div>
					</header>

					{/* Content */}
					<main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
						{children}
					</main>
				</div>
			</div>
		</AppShellContext.Provider>
	);
}
