import { useSignIn } from "@khufushome/auth";
import { AuthLayout } from "@khufushome/ui";
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
			{/* Login card */}
		<div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
			{/* Gradient header with mountain silhouette */}
			<div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 sm:h-52">
					<div className="absolute inset-0 opacity-30">
					<svg
						aria-hidden="true"
						viewBox="0 0 400 200"
						className="absolute bottom-0 w-full"
						preserveAspectRatio="none"
					>
							<path
								d="M0,200 L0,120 Q50,80 100,110 Q150,60 200,100 Q250,40 300,90 Q350,70 400,100 L400,200 Z"
								fill="rgba(99, 57, 116, 0.8)"
							/>
							<path
								d="M0,200 L0,150 Q80,110 160,140 Q240,100 320,130 Q360,120 400,140 L400,200 Z"
								fill="rgba(67, 34, 99, 0.6)"
							/>
						</svg>
					</div>
					{/* Moon */}
					<div className="absolute top-8 right-12 h-10 w-10 rounded-full bg-gradient-to-br from-accent-warm-200 to-accent-warm-400 opacity-80 shadow-lg shadow-accent-warm-300/30" />
					<div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
				</div>

			{/* Form */}
			<div className="bg-card px-5 pt-2 pb-6 sm:px-8 sm:pb-8">
					<h1 className="mb-6 text-center font-display text-3xl font-semibold tracking-tight text-text-primary">
						Sign In
					</h1>

					{error && (
						<div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="relative">
							<span className="absolute top-1/2 left-3 -translate-y-1/2 text-brand-400">
							<svg
								aria-hidden="true"
								className="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
								/>
								</svg>
							</span>
							<input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoComplete="email"
								className="w-full rounded-xl border border-brand-100 bg-brand-50/50 py-3 pr-4 pl-10 text-text-primary placeholder-brand-300 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
							/>
						</div>

						<div className="relative">
							<span className="absolute top-1/2 left-3 -translate-y-1/2 text-brand-400">
							<svg
								aria-hidden="true"
								className="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
								</svg>
							</span>
							<input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								autoComplete="current-password"
								className="w-full rounded-xl border border-brand-100 bg-brand-50/50 py-3 pr-4 pl-10 text-text-primary placeholder-brand-300 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-brand-700 to-brand-900 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-brand-700/30 transition hover:from-brand-800 hover:to-brand-950 hover:shadow-brand-800/40 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{loading ? (
								<span className="inline-flex items-center gap-2">
								<svg
									aria-hidden="true"
									className="h-4 w-4 animate-spin"
									viewBox="0 0 24 24"
									fill="none"
								>
										<circle
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="3"
											className="opacity-25"
										/>
										<path
											d="M4 12a8 8 0 018-8"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
											className="opacity-75"
										/>
									</svg>
									Signing in...
								</span>
							) : (
								"Sign In"
							)}
						</button>
					</form>

					<p className="mt-6 text-center text-xs text-muted-foreground">
						KhufusHome
					</p>
				</div>
			</div>
		</AuthLayout>
	);
}
