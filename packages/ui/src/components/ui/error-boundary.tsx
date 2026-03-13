import { Component, type ErrorInfo, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	className?: string;
}

export interface ErrorFallbackProps {
	error: Error;
	reset: () => void;
}

interface ErrorBoundaryState {
	error: Error | null;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.props.onError?.(error, errorInfo);
	}

	reset = () => {
		this.setState({ error: null });
	};

	render() {
		const { error } = this.state;
		const { children, fallback, className } = this.props;

		if (!error) return children;

		if (typeof fallback === "function") {
			return fallback({ error, reset: this.reset });
		}

		if (fallback) return fallback;

		return (
			<DefaultErrorFallback
				error={error}
				reset={this.reset}
				className={className}
			/>
		);
	}
}

function DefaultErrorFallback({
	error,
	reset,
	className,
}: ErrorFallbackProps & { className?: string }) {
	return (
		<div
			role="alert"
			className={cn(
				"flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center sm:p-10",
				className,
			)}
		>
			<div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
				<svg
					aria-hidden="true"
					className="size-6 text-destructive"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
					/>
				</svg>
			</div>

			<div className="space-y-1">
				<h3 className="font-display text-lg font-semibold text-foreground">
					Something went wrong
				</h3>
				<p className="max-w-sm text-sm text-muted-foreground">
					{error.message || "An unexpected error occurred."}
				</p>
			</div>

			<Button variant="outline" size="sm" onClick={reset}>
				Try again
			</Button>
		</div>
	);
}

export { DefaultErrorFallback };
