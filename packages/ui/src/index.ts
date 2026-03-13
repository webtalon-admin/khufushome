export { cn } from "./lib/utils";

// ── Primitives ──
export { Button, buttonVariants } from "./components/ui/button";
export { Input } from "./components/ui/input";
export { Badge, badgeVariants } from "./components/ui/badge";

// ── Card ──
export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
} from "./components/ui/card";

// ── Dialog (Modal) ──
export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogClose,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
} from "./components/ui/dialog";

// ── Dropdown Menu ──
export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuRadioGroup,
} from "./components/ui/dropdown-menu";

// ── Toast (Sonner) ──
export { Toaster } from "./components/ui/sonner";

// ── Table / DataTable ──
export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
} from "./components/ui/table";
export { DataTable } from "./components/ui/data-table";
export type { DataTableProps } from "./components/ui/data-table";

// ── StatusBadge ──
export { StatusBadge, statusBadgeVariants } from "./components/ui/status-badge";
export type { StatusBadgeProps } from "./components/ui/status-badge";

// ── Skeleton ──
export {
	Skeleton,
	SkeletonText,
	SkeletonCard,
	SkeletonTableRows,
	SkeletonPage,
} from "./components/ui/skeleton";

// ── Error Boundary ──
export { ErrorBoundary, DefaultErrorFallback } from "./components/ui/error-boundary";
export type {
	ErrorBoundaryProps,
	ErrorFallbackProps,
} from "./components/ui/error-boundary";

// ── Theme ──
export { ThemeProvider, useTheme } from "./hooks/use-theme";
export type { Theme, ThemeProviderProps } from "./hooks/use-theme";
export { ThemeToggle } from "./components/ui/theme-toggle";
export type { ThemeToggleProps } from "./components/ui/theme-toggle";

// ── Responsive ──
export { useMediaQuery, useIsMobile, breakpoints } from "./hooks/use-media-query";

// ── Layouts ──
export { AppShell, useAppShell } from "./components/layouts/AppShell";
export type { AppShellProps } from "./components/layouts/AppShell";

export { AuthLayout } from "./components/layouts/AuthLayout";
export type { AuthLayoutProps } from "./components/layouts/AuthLayout";

export { SubdomainNav } from "./components/layouts/SubdomainNav";
export type {
	SubdomainNavProps,
	AppUrls,
	AppId,
} from "./components/layouts/SubdomainNav";
