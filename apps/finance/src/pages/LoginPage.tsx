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
								d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
							/>
						</svg>
					</div>
					<h1 className="font-display text-2xl font-bold text-card-foreground">
						KhufusHome Finance
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Sign in to manage your finances
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
