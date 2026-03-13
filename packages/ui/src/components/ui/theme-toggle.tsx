import { Monitor, Moon, Sun } from "lucide-react";
import { type Theme, useTheme } from "../../hooks/use-theme";
import { cn } from "../../lib/utils";

const modes: { value: Theme; icon: typeof Sun; label: string }[] = [
	{ value: "light", icon: Sun, label: "Light" },
	{ value: "dark", icon: Moon, label: "Dark" },
	{ value: "system", icon: Monitor, label: "System" },
];

export interface ThemeToggleProps {
	className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
	const { theme, setTheme } = useTheme();

	return (
		<div
			className={cn(
				"inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5",
				className,
			)}
		>
			{modes.map(({ value, icon: Icon, label }) => (
				<button
					key={value}
					type="button"
					onClick={() => setTheme(value)}
					className={cn(
						"inline-flex items-center justify-center rounded-md p-1.5 transition-colors",
						theme === value
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
					title={label}
				>
					<Icon className="size-3.5" />
					<span className="sr-only">{label}</span>
				</button>
			))}
		</div>
	);
}
