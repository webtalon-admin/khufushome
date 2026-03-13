import { useSignIn } from "@khufushome/auth";
import { AuthLayout, Button, Input } from "@khufushome/ui";
import { type FormEvent, useState } from "react";

export function LoginPage() {
	const { signIn, loading, error } = useSignIn();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		await signIn(email, password);
	};

	return (
		<AuthLayout>
			<div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-8 shadow-2xl">
				<div className="mb-6 text-center">
					<div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg">
						<svg
							aria-hidden="true"
							className="size-6 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
							/>
						</svg>
					</div>
					<h1 className="font-display text-2xl font-bold text-card-foreground">
						KhufusHome 3D View
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Sign in to view your home
					</p>
				</div>

				{error && (
					<div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						autoComplete="email"
					/>
					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						autoComplete="current-password"
					/>
					<Button type="submit" disabled={loading} className="w-full">
						{loading ? "Signing in..." : "Sign In"}
					</Button>
				</form>

				<p className="mt-6 text-center text-xs text-muted-foreground">
					KhufusHome
				</p>
			</div>
		</AuthLayout>
	);
}
