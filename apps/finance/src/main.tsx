import { initAuth } from "@khufushome/auth";
import { getClientConfig } from "@khufushome/config/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./App.css";

const cfg = getClientConfig();

initAuth({
	supabaseUrl: cfg.supabase.url,
	anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
	cookieDomain: cfg.supabase.auth_cookie_domain,
}).then(() => {
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
});
