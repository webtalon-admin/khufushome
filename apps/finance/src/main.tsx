import { initAuth } from "@khufushome/auth";
import { getClientConfig } from "@khufushome/config/client";
import { ThemeProvider } from "@khufushome/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			refetchOnWindowFocus: false,
		},
	},
});

const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const cfg = getClientConfig();

initAuth({
	supabaseUrl: cfg.supabase.url,
	anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
	cookieDomain: cfg.supabase.auth_cookie_domain,
}).then(() => {
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<ThemeProvider>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</ThemeProvider>
		</StrictMode>,
	);
});
