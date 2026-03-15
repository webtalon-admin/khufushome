# KhufusHome -- Home Automation & Finance Platform

Build a secure, multi-subdomain home platform using a Turborepo monorepo with React/TypeScript frontends, Supabase backend (auth, DB, real-time), a comprehensive personal finance app (loans, portfolio, super, tax, budgeting), Home Assistant for device control, React Three Fiber for 3D house visualization -- all open-source and free to run.

## Checklist

- [ ] **Phase 1:** Project Foundation -- Turborepo monorepo, pnpm, Vite apps, shared packages, Biome, Tailwind
- [ ] **Phase 2:** Auth + Shared UI -- Supabase auth (just enough for RLS), shadcn/ui core components, AppShell layout, dark/light mode
- [ ] **Phase 3:** Finance App -- Finance Home (net worth hub), accounts, transactions, CSV import, loans (mortgage/novated lease/BTC-backed/personal), portfolio (stocks + crypto with CGT), superannuation split into Analysis (overview/historical/projections) + Research (allocations/fees/fund papers from super-research tool), budgets with forward projections, Australian tax calculator, Recharts visualizations
- [ ] **Phase 4:** Main Dashboard App -- khufushome.com hub, activity feed, user settings, TanStack Router + Query
- [ ] **Phase 5:** Home Automation Backend -- Home Assistant + Mosquitto via UmbrelOS, HA client library, device registry in Supabase
- [ ] **Phase 6:** 3D House Visualization -- React Three Fiber scene, GLB model loading, clickable rooms/devices, control panels
- [ ] **Phase 7:** Real-Time Device Integration -- HA WebSocket subscriptions, Zustand device store, live 3D state updates, automation rules
- [ ] **Phase 8:** Infrastructure & Deployment -- Cloudflare Pages (frontends), Cloudflare Tunnel via UmbrelOS, GitHub Actions CI/CD
- [ ] **Phase 9:** Security Hardening & Polish -- Security audit, Vitest + Playwright tests, Lighthouse perf, PWA, onboarding, docs

---

## Deployment Model

- **Source code:** GitHub repo (`missakahemachandra/khufushome`)
- **Domain:** `khufushome.com` managed on **Cloudflare**
- **Frontend apps:** Deploy to **Cloudflare Pages** (free) -- auto-deploy on push to main, preview on PR
- **Home server:** **UmbrelOS** on a separate machine -- runs Home Assistant, Mosquitto MQTT, and Cloudflare Tunnel as one-click app store installs
- **Home Assistant access:** Exposed securely via **Cloudflare Tunnel** (free) at `ha.khufushome.com` -- no open ports
- **Database / Auth / Realtime:** **Supabase** (hosted cloud)
- **Cost:** $0/month until you need Supabase Pro ($25/month) for production backups and scale

---

## Architecture Overview

```mermaid
graph TD
    subgraph subdomains [Subdomains]
        Main["khufushome.com<br/>(Dashboard)"]
        ThreeD["threedimension.khufushome.com<br/>(3D House View)"]
        Finance["finance.khufushome.com<br/>(Finance Manager)"]
        HADomain["ha.khufushome.com<br/>(Home Assistant API)"]
    end

    subgraph cloudflare [Cloudflare]
        DNS["Cloudflare DNS"]
        Pages["Cloudflare Pages<br/>(Free static hosting)"]
        Tunnel["Cloudflare Tunnel<br/>(Secure tunnel to UmbrelOS)"]
        WAF["Cloudflare WAF / DDoS<br/>(Free tier protection)"]
    end

    subgraph monorepo [Turborepo Monorepo - GitHub]
        AppDash["apps/dashboard"]
        AppThreeD["apps/threedimension"]
        AppFinance["apps/finance"]
        PkgUI["packages/ui"]
        PkgAuth["packages/auth"]
        PkgTypes["packages/types"]
        PkgConfig["packages/config"]
        PkgHA["packages/home-assistant"]
    end

    subgraph umbrelServer [UmbrelOS Home Server]
        HA["Home Assistant<br/>(Umbrel App Store)"]
        MQTT["Mosquitto MQTT<br/>(Umbrel App Store)"]
        Cloudflared["Cloudflare Tunnel<br/>(Umbrel App Store)"]
    end

    subgraph hosted [Hosted Services]
        Supabase["Supabase<br/>(Auth / DB / RLS / Realtime / Edge Functions)"]
    end

    subgraph freeAPIs [Free Price APIs]
        CoinGecko["CoinGecko API<br/>(Crypto prices in AUD)"]
        YahooFin["Yahoo Finance<br/>(ASX + US stock prices)"]
    end

    Main --> DNS
    ThreeD --> DNS
    Finance --> DNS
    HADomain --> DNS
    DNS --> WAF
    WAF --> Pages
    WAF --> Tunnel
    Pages --> AppDash
    Pages --> AppThreeD
    Pages --> AppFinance
    Tunnel --> Cloudflared
    Cloudflared --> HA
    AppDash --> Supabase
    AppThreeD --> Supabase
    AppThreeD --> HA
    AppFinance --> Supabase
    AppFinance --> CoinGecko
    AppFinance --> YahooFin
    HA --> MQTT
    PkgAuth --> Supabase
    PkgHA --> HA
```

---

## Environment Management and Secrets Strategy

### Two Environments: `local` and `prod`

Switch between environments by setting a single env var or using the config file at the repo root.

| Aspect | `local` | `prod` |
|---|---|---|
| Supabase | Local via `supabase start` (Docker) | Hosted cloud project |
| Home Assistant | Local HA container or mock server | UmbrelOS via Cloudflare Tunnel |
| MQTT | Local Mosquitto container | UmbrelOS Mosquitto |
| Frontend URLs | `localhost:5173/5174/5175` | `*.khufushome.com` via Cloudflare Pages |
| Auth cookie domain | `localhost` | `.khufushome.com` |
| SSL | None (http://localhost) | Cloudflare auto-TLS |

### Config File: `config/env.yaml`

A single YAML file at the repo root defines non-secret, environment-specific values. Switch environments by changing `KHUFUS_ENV=local` or `KHUFUS_ENV=prod` -- the config loader reads the matching block.

```yaml
local:
  supabase:
    url: "http://127.0.0.1:54321"
    auth_cookie_domain: "localhost"
  home_assistant:
    url: "http://localhost:8123"
    websocket_url: "ws://localhost:8123/api/websocket"
  mqtt:
    host: "localhost"
    port: 1883
  apps:
    dashboard_url: "http://localhost:5173"
    threedimension_url: "http://localhost:5174"
    finance_url: "http://localhost:5175"
  features:
    mock_devices: true
    seed_data: true

prod:
  supabase:
    url: "https://<project-id>.supabase.co"
    auth_cookie_domain: ".khufushome.com"
  home_assistant:
    url: "https://ha.khufushome.com"
    websocket_url: "wss://ha.khufushome.com/api/websocket"
  mqtt:
    host: "mosquitto"  # UmbrelOS Docker network hostname
    port: 1883
  apps:
    dashboard_url: "https://khufushome.com"
    threedimension_url: "https://threedimension.khufushome.com"
    finance_url: "https://finance.khufushome.com"
  features:
    mock_devices: false
    seed_data: false
```

This file is **committed to the repo** -- it contains no secrets, only URLs and feature flags.

### Secrets Management Strategy

Secrets are **never committed**. They live in different places depending on context:

```
┌─────────────────────┬──────────────────────────────────────────────────────┐
│ Context             │ Where secrets live                                   │
├─────────────────────┼──────────────────────────────────────────────────────┤
│ Local dev           │ .env.local (gitignored)                              │
│ CI (GitHub Actions) │ GitHub repo Settings > Secrets                       │
│ Prod frontend       │ Cloudflare Pages > Settings > Environment Variables  │
│ Prod home server    │ ~/umbrel/app-data/<app>/  config files on UmbrelOS   │
│ Supabase Edge Fns   │ Supabase Dashboard > Edge Functions > Secrets        │
└─────────────────────┴──────────────────────────────────────────────────────┘
```

### Secret Files

**`.env.local`** (gitignored, local dev only):

```bash
KHUFUS_ENV=local

# Supabase (local instance via `supabase start`)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<local-service-key-from-supabase-start>
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Home Assistant (local container)
HA_ACCESS_TOKEN=<local-ha-long-lived-token>

# MQTT (local Mosquitto)
MQTT_USERNAME=dev
MQTT_PASSWORD=devpassword
```

**`.env.prod`** (gitignored, reference only -- actual values in Cloudflare/GitHub):

```bash
KHUFUS_ENV=prod

# Supabase (hosted)
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-key>

# Home Assistant (via Cloudflare Tunnel)
HA_ACCESS_TOKEN=<prod-ha-long-lived-token>

# MQTT (UmbrelOS Mosquitto)
MQTT_USERNAME=khufushome
MQTT_PASSWORD=<strong-prod-password>
```

**`.env.example`** (committed, documents all required vars):

```bash
KHUFUS_ENV=local  # or 'prod'

# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# Home Assistant
HA_ACCESS_TOKEN=

# MQTT
MQTT_USERNAME=
MQTT_PASSWORD=
```

### Config Loader (`packages/config/src/env.ts`)

A shared TypeScript module that reads `KHUFUS_ENV`, loads the matching block from `config/env.yaml`, and merges with env vars (secrets). All apps import from this package.

```typescript
import yaml from 'yaml';
import { readFileSync } from 'fs';
import { z } from 'zod';

const envSchema = z.object({
  supabase: z.object({
    url: z.string().url(),
    auth_cookie_domain: z.string(),
  }),
  home_assistant: z.object({
    url: z.string().url(),
    websocket_url: z.string(),
  }),
  // ... validated with Zod
});

export function loadConfig() {
  const env = process.env.KHUFUS_ENV ?? 'local';
  const raw = yaml.parse(readFileSync('config/env.yaml', 'utf-8'));
  return envSchema.parse(raw[env]);
}
```

For Vite (browser-side), the config loader exposes values via `VITE_` prefixed env vars at build time. The `config/env.yaml` values are injected into Vite's `define` or via a small Vite plugin during `turbo build`.

### Local Dev Setup (one command)

```bash
# 1. Copy the example env file
cp .env.example .env.local

# 2. Fill in your local secrets in .env.local

# 3. Start local Supabase (Docker)
pnpm supabase start

# 4. Start all apps + local HA mock
pnpm dev           # runs: KHUFUS_ENV=local turbo dev
```

To switch to testing against prod services locally:

```bash
# Use prod config but still run frontends locally
KHUFUS_ENV=prod pnpm dev
```

### `.gitignore` Entries

```
.env.local
.env.prod
.env.*.local
*.secret
```

### Directory Structure (config-related files)

```
khufushome/
├── config/
│   └── env.yaml              # Non-secret env config (committed)
├── .env.example              # Template for secrets (committed)
├── .env.local                # Local secrets (gitignored)
├── .env.prod                 # Prod secrets reference (gitignored)
├── packages/
│   └── config/
│       └── src/
│           └── env.ts        # Config loader with Zod validation
└── ...
```

### Supabase Local Development

Supabase CLI runs a full local stack via Docker -- Postgres, Auth, Storage, Realtime, Edge Functions -- matching production behavior:

```bash
supabase start     # Spins up local Supabase (prints local keys)
supabase db reset  # Apply migrations + seed data
supabase stop      # Tear down
```

The local Supabase keys printed by `supabase start` go into `.env.local`. This means you can develop and test everything without touching the production Supabase project.

### Home Assistant Local Dev

For local development without a real HA instance, two options:

1. **Docker HA container:** Run a local Home Assistant container with mock devices for full integration testing
2. **Mock server:** A lightweight Express/Fastify server in `packages/home-assistant/src/mock/` that mimics the HA REST + WebSocket API with fake device states -- faster startup, no Docker needed

The `features.mock_devices: true` flag in `config/env.yaml` (local block) tells the HA client package to use the mock server instead of a real HA instance.

---

## Recommended Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Monorepo | **Turborepo + pnpm** | Fast builds, shared deps, workspaces |
| Frontend | **Vite + React 19 + TypeScript** | Fast dev, modern React, type safety |
| Routing | **TanStack Router** | Type-safe routing, best-in-class for TS |
| UI | **Tailwind CSS v4 + shadcn/ui** | Open-source, composable, beautiful |
| State | **Zustand** | Lightweight, TS-friendly, no boilerplate |
| Data Fetching | **TanStack Query** | Caching, background refresh, optimistic updates |
| Auth / DB / Realtime | **Supabase** (free tier to start) | Auth, Postgres, RLS, Realtime, Edge Functions |
| Charts | **Recharts** | Open-source React charting, composable, free |
| Crypto Prices | **CoinGecko API** (free, no key) | BTC/crypto in AUD, 10-30 req/min |
| Stock Prices | **Yahoo Finance** (`yahoo-finance2` npm) | ASX (.AX suffix) + US stocks, free, no key |
| 3D Rendering | **React Three Fiber + @react-three/drei** | Declarative Three.js in React |
| 3D Modeling | **Blender** (free) | Create/export house models as glTF/GLB |
| Home Automation | **Home Assistant** (UmbrelOS app) | 2000+ device integrations, REST + WebSocket API |
| Device Protocol | **Mosquitto MQTT** (UmbrelOS app) | Lightweight IoT messaging, HA native support |
| Static Hosting | **Cloudflare Pages** (free) | Auto-deploy from GitHub, preview on PR, CDN edge |
| Secure Tunnel | **Cloudflare Tunnel** (UmbrelOS app, free) | Expose HA without open ports, zero-trust access |
| DNS / CDN / WAF | **Cloudflare** (free tier) | DNS, DDoS protection, caching, SSL -- all free |
| Home Server OS | **UmbrelOS** | One-click app installs, Docker-based, auto-updates |
| CI/CD | **GitHub Actions + Cloudflare Pages** | Lint/test in GH Actions, deploy via CF Pages |
| Testing | **Vitest + Playwright** | Fast unit tests, E2E browser tests |
| Linting | **Biome** | Fast all-in-one linter/formatter for TS |

---

## Phase 1: Project Foundation and Monorepo Setup

**Goal:** Scaffold the Turborepo monorepo with all app shells and shared packages.

- [x] Initialize Turborepo with pnpm workspaces
- [x] Create `pnpm-workspace.yaml` defining `apps/*` and `packages/*`
- [x] Scaffold three Vite + React + TypeScript apps:
  - `apps/dashboard` (khufushome.com)
  - `apps/threedimension` (threedimension.khufushome.com)
  - `apps/finance` (finance.khufushome.com)
- [x] Create shared packages:
  - `packages/ui` -- shared component library
  - `packages/auth` -- Supabase auth client and hooks
  - `packages/types` -- shared TypeScript types/interfaces
  - `packages/config` -- shared ESLint, TypeScript, Tailwind configs
  - `packages/home-assistant` -- HA API client
- [x] Configure `turbo.json` with build/dev/lint pipelines
- [x] Set up Biome for linting and formatting
- [x] Set up Tailwind CSS v4 in shared config, consumed by all apps
- [x] Add `.gitignore` (including `.env.local`, `.env.prod`, `*.secret`), `.env.example`, and root `README.md`
- [x] Create `config/env.yaml` with `local` and `prod` environment blocks
- [x] Build config loader in `packages/config/src/env.ts` with Zod schema validation
- [x] Set up Supabase CLI local dev (`supabase init`, initial migration, seed file)
- [x] Create HA mock server stub in `packages/home-assistant/src/mock/`
- [x] Wire up `KHUFUS_ENV` env var switching: `pnpm dev` defaults to local, `KHUFUS_ENV=prod pnpm dev` uses prod config
- [x] Verify `turbo dev` runs all three apps concurrently on different ports

**Directory structure after Phase 1:**

```
khufushome/
├── apps/
│   ├── dashboard/          # Main landing + navigation
│   ├── threedimension/     # 3D house view
│   └── finance/            # Finance management
├── packages/
│   ├── ui/                 # Shared components (shadcn/ui based)
│   ├── auth/               # Supabase auth hooks & client
│   ├── types/              # Shared TypeScript types
│   ├── config/             # Shared configs (tailwind, ts, biome) + env loader
│   └── home-assistant/     # HA API client library + mock server
├── config/
│   └── env.yaml            # Non-secret env config (local + prod blocks)
├── supabase/
│   ├── migrations/         # SQL migrations
│   ├── functions/          # Edge Functions
│   └── seed.sql            # Dev seed data
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example            # Template documenting all required secrets
├── .env.local              # Local secrets (gitignored)
└── README.md
```

---

## Phase 2: Auth + Shared UI

**Goal:** Set up Supabase auth (just enough for RLS and protected routes) and initialize the shared UI component library. Combined and slimmed from the original separate auth and UI phases to unblock the finance app faster.

### Authentication

> **Auth model:** Admin-provisioned only. No self-service sign-up or magic links.
> Users are created manually via the Supabase dashboard (prod) or CLI (local dev).
>
> **Roles:**
> - `admin` -- full access (you)
> - `member` -- standard access (partner / household members)

- [x] Create Supabase project and obtain API keys
- [x] Install `@supabase/supabase-js` in `packages/auth`
- [x] Create shared Supabase client factory in `packages/auth/src/client.ts`
- [x] Implement auth hooks in `packages/auth`:
  - `useAuth()` -- current session, user, loading state
  - `useRequireAuth()` -- redirect to login if not authenticated
  - `useSignIn()` / `useSignOut()`
  - `useRole()` -- reads `profiles.role`, returns `{ role, isAdmin, isMember, loading }`
- [x] Configure Supabase Auth providers:
  - Email/password only (sign-up disabled -- users provisioned in Supabase dashboard)
- [x] `profiles` table with RLS (already exists in migrations):

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (id = (select auth.uid()));
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = (select auth.uid()));
```

- [x] Set up session sharing across subdomains:
  - Configure Supabase auth cookie domain to `.khufushome.com`
  - Use `supabase.auth.getSession()` on each app init
- [x] Create login page in `apps/dashboard` (shared across subdomains via redirect)
- [x] Implement protected route wrapper component in `packages/auth`

**User provisioning (local dev):**
```bash
pnpm supabase auth admin create-user \
  --email you@example.com --password <pw> \
  --user-metadata '{"full_name":"Your Name"}'
```
**User provisioning (prod):** Use the Supabase dashboard Authentication tab. The `handle_new_user()` trigger auto-creates the profile row (default role: `admin`). Update partner's role to `member` after creation.

### Shared UI

- [x] Initialize shadcn/ui in `packages/ui` with Tailwind CSS v4
- [x] Create base theme (colors, typography, spacing)
- [x] Build shared layout components:
  - `AppShell` -- sidebar + header + content area
  - `AuthLayout` -- centered card for login/signup
  - `SubdomainNav` -- navigation between khufushome subdomains
- [x] Add core shared components:
  - `Button`, `Input`, `Card`, `Modal`, `Toast`, `Dropdown`
  - `DataTable` (for finance app)
  - `StatusBadge` (online/offline/error states)
- [x] Create a dark/light mode toggle (persisted in localStorage)
- [x] Set up component exports from `packages/ui` consumable by all apps
- [x] Ensure responsive design (mobile-first) for all layouts
- [x] Add loading skeletons and error boundary components

---

## Phase 3: Finance App (finance.khufushome.com)

**Goal:** Build a comprehensive personal finance manager for an Australian tax resident. The Finance Home page shows total net worth (all assets/liabilities/cash/super) with navigation into each section. Covers bank accounts, transactions (CSV import from Macquarie), loans (mortgage, novated lease, BTC-backed via Ledn, personal), investment portfolio (ASX/US stocks + crypto with CGT tracking), superannuation split into Analysis (overview with AU benchmarks, historical performance with fund-switch tracking, projections) and Research (asset allocations, fee impact, fund research papers), budgeting with forward projections, and Australian tax estimation. Super research data is auto-refreshed from free government APIs (APRA QSPS CSVs + ATO YourSuper API) via backend pipeline jobs in the monorepo. Analysis logic is ported from the `research/super-research/` Python tool to TypeScript. All free -- no paid APIs or services.

### Free API Strategy

All price/market data is free:

- **CoinGecko API** (no key needed): BTC/crypto prices in AUD. `GET /api/v3/simple/price?ids=bitcoin&vs_currencies=aud`. 10-30 req/min free tier -- more than enough for one user.
- **Yahoo Finance** (via `yahoo-finance2` npm): ASX stocks use `.AX` suffix (e.g., `BHP.AX`). US stocks direct. No API key. Historical data for charts.
- **Price caching**: Store fetched prices in a `price_history` Supabase table. Refresh on-demand when user opens the app, or via a Supabase cron Edge Function (free tier supports scheduled functions).
- **Bank data**: CSV export from Macquarie (primary), with a flexible column mapper that can handle other AU bank CSV formats later.

**Superannuation data (free, government sources):**

- **APRA Quarterly Superannuation Product Statistics (QSPS)** — the authoritative source for all AU super fund data. Published quarterly as downloadable CSVs from `apra.gov.au`. Covers:
  - **Historical Performance CSV** (~70 MB) — fund-level returns by quarter/year for every APRA-regulated product
  - **Historical SAA CSV** (~139 MB) — strategic asset allocation breakdowns per fund/option
  - **QSPS Tables 1a-1b** — product structure, fees, costs, investment options
  - **QSPS Tables 4-11** — granular fee/cost data per product
  - No API — data is downloaded as CSV/XLSX/ZIP from static URLs (updated quarterly, next release Jun 2026)
  - Download URLs follow a predictable pattern: `https://www.apra.gov.au/sites/default/files/{YYYY-MM}/Historical%20performance%20%281%29.csv`
- **ATO YourSuper API** — JSON API at `ato.gov.au/api/v1/YourSuper/APRAData` providing MySuper product performance test results, net returns, and fee summaries. Wrapped by the open-source `PythonYourSuperAPI` library (`pip install YourSuperAPI`). Useful for the Overview page (performance test status: performing/underperforming).
- **ATO median super balances by age** — published in ATO annual statistics (already captured in `research/super-research/data/benchmarks/au_median_balance_by_age.csv`). Updated ~annually.

### Super Data Pipeline (automated refresh)

All pipeline code lives **inside the monorepo**, not in the standalone `research/super-research/` Python app. The research folder is treated as a read-only reference — we port its data models and logic into the finance app's stack but don't add new code there.

**Where the code lives:**

- **Supabase Edge Functions** (`supabase/functions/`) — preferred for the ATO YourSuper API (small JSON payloads, TypeScript/Deno, runs on Supabase's free tier with cron scheduling)
- **Python scripts** (`scripts/super-pipeline/`) — preferred for APRA CSV ingestion (large files ~70-139 MB are easier to stream/parse in Python than in a Deno Edge Function with 150 MB memory / 60s timeout). These scripts live in the monorepo root under `scripts/`, use the Supabase Python client (`supabase-py`) with the service role key, and are invoked manually or via a GitHub Action cron
- Both approaches push data into the same Supabase tables and log results to `data_pipeline_logs`

**Pipeline jobs:**

1. **APRA CSV Ingestion** (quarterly, Python script in `scripts/super-pipeline/`):
   - Download the Historical Performance CSV and Historical SAA CSV from APRA's public URLs
   - Parse and filter for the tracked funds (by ABN + product/option name)
   - Transform into the `super_fund_returns`, `super_fund_allocations`, and `super_fund_fees` table schemas
   - Upsert into Supabase via `supabase-py` (new quarters added, existing data unchanged)
   - Run locally with `pnpm run pipeline:apra` (a root-level script that invokes the Python script) or on a GitHub Actions quarterly cron

2. **ATO YourSuper API** (quarterly, Supabase Edge Function):
   - Fetch MySuper product performance test results (performing / underperforming / not assessed)
   - Fetch net return rankings and fee summaries
   - Store in `super_yoursuper_status` table for display on the Overview page
   - Triggered by Supabase `pg_cron` or manually via a "Refresh Data" button in the Finance app

3. **Triggers**:
   - Supabase `pg_cron` for the Edge Function (free tier)
   - GitHub Actions cron (quarterly) for the Python APRA script
   - Manual trigger via "Refresh Data" button in the Research section (invokes the Edge Function; for APRA, shows a "Run locally" instruction since it needs the Python script)
   - Log last refresh date so the UI can show "Data as of: March 2026 (APRA QSPS)"

**Compatibility with the stack:**

- Python scripts use `supabase-py` and standard CSV libraries — no special infrastructure needed
- A `requirements.txt` in `scripts/super-pipeline/` pins dependencies
- The scripts are standalone (no dependency on the research Streamlit app) but port the same data-processing logic
- `pnpm` root scripts wrap the Python invocations so the dev experience stays consistent (`pnpm run pipeline:apra`, `pnpm run pipeline:yoursuper`)

No paid services required. Total cost: $0/month on Supabase free tier.

### Data Model (Supabase / Postgres)

#### Accounts

```sql
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  institution TEXT,
  currency TEXT DEFAULT 'AUD',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Account `type` values: `checking`, `savings`, `credit_card`, `investment`, `crypto_exchange`, `super`, `offset`, `loan`.

`metadata` holds type-specific fields (e.g., BSB/account number for bank, exchange name for crypto, fund name + member number for super -- see Superannuation section below).

#### Transactions

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES accounts NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  import_hash TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_txn_import_hash ON transactions(import_hash);
CREATE INDEX idx_txn_date ON transactions(user_id, date);
```

`type`: `income`, `expense`, `transfer`. `import_hash`: SHA-256 of (date + amount + description) for duplicate detection on CSV import. `recurrence_rule`: iCal RRULE string for recurring transactions (e.g., `FREQ=MONTHLY;BYMONTHDAY=15`).

#### Loans (generic with type-specific metadata)

```sql
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  principal NUMERIC(14,2) NOT NULL,
  current_balance NUMERIC(14,2),
  interest_rate NUMERIC(7,4) NOT NULL,
  rate_type TEXT DEFAULT 'variable',
  term_months INTEGER,
  monthly_payment NUMERIC(14,2),
  start_date DATE NOT NULL,
  end_date DATE,
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

`loan_type`: `mortgage`, `novated_lease`, `btc_backed`, `personal`, `car`, `margin`.

`extra_data` by type:

- **mortgage**: `{ offset_account_id, redraw_available, fixed_until, lender }`
- **novated_lease**: `{ vehicle_make, vehicle_model, vehicle_year, residual_value, residual_pct, pre_tax_deduction, post_tax_deduction, gst_saving, fbt_value, running_costs_monthly, lease_provider }`
- **btc_backed (Ledn)**: `{ collateral_btc, ltv_ratio, margin_call_ltv, liquidation_ltv, collateral_wallet, interest_payment_method }`
- **personal**: `{ lender, purpose }`

#### Loan Payments

```sql
CREATE TABLE loan_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  principal_portion NUMERIC(14,2),
  interest_portion NUMERIC(14,2),
  extra_payment NUMERIC(14,2) DEFAULT 0,
  payment_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Assets (portfolio holdings)

```sql
CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES accounts,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  quantity NUMERIC(18,8) NOT NULL DEFAULT 0,
  avg_cost_base NUMERIC(14,4),
  currency TEXT DEFAULT 'AUD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

`asset_type`: `stock_asx`, `stock_us`, `crypto`, `etf`, `property`.

#### Asset Transactions (for CGT tracking)

```sql
CREATE TABLE asset_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  asset_id UUID REFERENCES assets NOT NULL,
  type TEXT NOT NULL,
  quantity NUMERIC(18,8) NOT NULL,
  price_per_unit NUMERIC(14,4) NOT NULL,
  fees NUMERIC(14,2) DEFAULT 0,
  total_value NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

`type`: `buy`, `sell`, `dividend`, `distribution`, `split`, `transfer_in`, `transfer_out`.

CGT is calculated from these records using FIFO method: each `sell` is matched against the earliest `buy` lots. If held >12 months, 50% CGT discount applies.

#### Price History (cache)

```sql
CREATE TABLE price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price_aud NUMERIC(14,4) NOT NULL,
  source TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_price_symbol_date ON price_history(symbol, recorded_at);
```

#### Budgets

```sql
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE budget_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES budgets NOT NULL,
  category TEXT NOT NULL,
  allocated NUMERIC(14,2) NOT NULL,
  rollover BOOLEAN DEFAULT false
);
```

#### Tax Profiles (Australian)

```sql
CREATE TABLE tax_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  financial_year TEXT NOT NULL,
  gross_salary NUMERIC(14,2),
  tax_withheld NUMERIC(14,2),
  other_income JSONB DEFAULT '{}',
  deductions JSONB DEFAULT '{}',
  cgt_events JSONB DEFAULT '[]',
  medicare_levy NUMERIC(14,2),
  estimated_tax NUMERIC(14,2),
  estimated_refund NUMERIC(14,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, financial_year)
);
```

`financial_year`: e.g., `"2025-2026"` (AU FY is July-June).

`other_income` structure: `{ dividends, franking_credits, crypto_income, rental, interest, other }`.

`deductions` structure: `{ work_related: { uniforms, tools, travel, ... }, self_education, investment: { interest, fees }, donations, other }`.

`cgt_events`: Array of `{ asset, date_acquired, date_sold, cost_base, proceeds, gain_loss, held_over_12m, discount_applied }`.

#### Income Sources

```sql
CREATE TABLE income_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  frequency TEXT NOT NULL,
  is_pre_tax BOOLEAN DEFAULT true,
  tax_withheld NUMERIC(14,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

`type`: `salary`, `dividend`, `crypto`, `rental`, `interest`, `freelance`, `other`.
`frequency`: `weekly`, `fortnightly`, `monthly`, `quarterly`, `annually`, `one_off`.

#### Superannuation

Super fund accounts use the existing `accounts` table with `type = 'super'` and fund-specific metadata:

```
accounts.metadata for type='super':
{
  "fund_name": "Future Super",         // or "Hostplus"
  "member_number": "...",
  "investment_option": "Balanced Growth",
  "insurance_premiums_monthly": 12.50,
  "admin_fee_monthly": 6.00
}
```

Contributions are tracked in a dedicated table:

```sql
CREATE TABLE super_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  super_account_id UUID REFERENCES accounts NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  financial_year TEXT NOT NULL,
  employer_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_super_fy ON super_contributions(user_id, financial_year);
```

`type`: `employer_sg` (Super Guarantee, currently 11.5%), `salary_sacrifice` (concessional, pre-tax), `personal_concessional` (claimed as deduction), `personal_non_concessional` (after-tax, no deduction), `government_co_contribution`.

Balance snapshots for tracking growth over time:

```sql
CREATE TABLE super_balance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  super_account_id UUID REFERENCES accounts NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  balance NUMERIC(14,2) NOT NULL,
  recorded_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Fund switch events for historical performance tracking:

```sql
CREATE TABLE super_fund_switches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  from_account_id UUID REFERENCES accounts,
  to_account_id UUID REFERENCES accounts NOT NULL,
  switch_date DATE NOT NULL,
  reason TEXT,
  balance_at_switch NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

This records when you change super funds (e.g., Future Super → Hostplus). Displayed as markers on the historical performance chart so before/after performance is clearly separated.

The user manually enters balance snapshots periodically (e.g., after each quarterly statement). Contributions are entered as they occur (each pay cycle or manually). This gives us:
- Total contributions per FY (for cap tracking)
- Balance growth over time (for net worth and charts)
- Concessional cap monitoring ($30,000 for 2025-2026 FY)
- Clear fund-switch timeline for historical analysis

Multiple funds supported: the user currently has Future Super and will move to Hostplus. Both can be tracked simultaneously during transition (one active, one archived).

#### Super Reference Data Tables

Static/semi-static data populated by the Super Data Pipeline (see above). Initially seeded from `research/super-research/` data, then auto-refreshed from APRA/ATO APIs:

```sql
CREATE TABLE super_fund_reference (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  option_name TEXT NOT NULL,
  fund_type TEXT NOT NULL,
  aum_billions NUMERIC(10,2),
  members INTEGER,
  return_target TEXT,
  growth_defensive_split JSONB,
  website TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE super_fund_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id TEXT REFERENCES super_fund_reference NOT NULL,
  fy TEXT NOT NULL,
  return_pct NUMERIC(6,2) NOT NULL,
  return_type TEXT NOT NULL,
  source TEXT,
  UNIQUE(fund_id, fy)
);

CREATE TABLE super_fund_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id TEXT REFERENCES super_fund_reference NOT NULL,
  australian_equities NUMERIC(5,2),
  international_equities NUMERIC(5,2),
  property NUMERIC(5,2),
  infrastructure NUMERIC(5,2),
  private_equity NUMERIC(5,2),
  alternatives NUMERIC(5,2),
  fixed_income NUMERIC(5,2),
  cash NUMERIC(5,2),
  source TEXT,
  UNIQUE(fund_id)
);

CREATE TABLE super_fund_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id TEXT REFERENCES super_fund_reference NOT NULL,
  admin_fee_flat NUMERIC(8,2) DEFAULT 0,
  admin_fee_pct NUMERIC(5,3) DEFAULT 0,
  investment_fee_pct NUMERIC(5,3) DEFAULT 0,
  performance_fee_pct NUMERIC(5,3),
  transaction_cost_pct NUMERIC(5,3),
  total_on_50k NUMERIC(8,2),
  total_on_100k NUMERIC(8,2),
  source TEXT,
  UNIQUE(fund_id)
);
```

```sql
CREATE TABLE super_yoursuper_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id TEXT REFERENCES super_fund_reference NOT NULL,
  assessment TEXT NOT NULL,
  net_return_pa NUMERIC(6,2),
  fees_pa_on_50k NUMERIC(8,2),
  ranking INTEGER,
  data_date DATE NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fund_id, data_date)
);
```

`assessment`: `performing`, `underperforming`, `not_assessed` (from ATO YourSuper performance test).

These tables are initially seeded (one-time) from the CSV/YAML files in `research/super-research/data/` via the `--seed` flag on the APRA pipeline script. After that, they are **automatically refreshed** by the Super Data Pipeline (APRA CSV ingestion + ATO YourSuper API). The `research/super-research/` folder is read-only reference — all new pipeline code lives in `scripts/super-pipeline/` and `supabase/functions/`.

### Australian Tax Calculator Logic

Hardcoded but configurable tax brackets (2025-2026 FY):

```
$0 - $18,200         -> Nil
$18,201 - $45,000    -> 16c per $1 over $18,200
$45,001 - $135,000   -> $4,288 + 30c per $1 over $45,000
$135,001 - $190,000  -> $31,288 + 37c per $1 over $135,000
$190,001+            -> $51,638 + 45c per $1 over $190,000
+ Medicare levy: 2% of taxable income
```

Store brackets as a JSON config in `packages/types` so they can be updated when the ATO changes rates. The calculator:

1. Sums all income (salary + dividends + CGT + other)
2. Subtracts salary sacrifice (reduces assessable income)
3. Subtracts allowable deductions (including personal concessional super contributions if claimed)
4. Applies brackets to get base tax
5. Adds Medicare levy (2%)
6. Adds Division 293 tax if applicable (extra 15% on concessional super contributions if income > $250k)
7. Subtracts tax already withheld (PAYG from salary)
8. Returns estimated refund or amount owing

Super-specific tax considerations:
- Concessional contributions (employer SG + salary sacrifice + personal deductible) are taxed at 15% inside the fund, not at the individual's marginal rate
- Concessional cap: $30,000/year -- excess taxed at marginal rate + interest charge
- The tax calculator shows the effective tax saving from salary sacrifice as a separate line item

CGT calculation:
- Match sells against buys using FIFO
- If asset held >12 months, apply 50% discount to the gain
- Net capital gain added to taxable income

### Superannuation Salary Sacrifice Calculator

A modelling tool to evaluate the benefit of salary sacrificing into super:

**Inputs**: Gross salary, current employer SG rate (11.5%), proposed salary sacrifice amount (per pay cycle), pay frequency, marginal tax rate (auto-calculated from salary).

**Calculations**:
- Without sacrifice: Take-home pay = gross - income tax - Medicare levy - SG contribution (paid by employer, doesn't reduce pay)
- With sacrifice: Take-home pay = (gross - sacrifice amount) - income tax on reduced salary - Medicare levy on reduced salary
- Super contribution tax: Concessional contributions (SG + salary sacrifice) taxed at 15% inside super
- Net benefit = income tax saved - super contributions tax on sacrifice amount
- Effective tax rate on sacrificed amount = 15% vs marginal rate

**Constraints**:
- Concessional cap: $30,000/year (2025-2026). Employer SG + salary sacrifice must not exceed this.
- Warn if proposed sacrifice would breach the cap.

**Output**:
- Side-by-side: take-home pay with vs without sacrifice
- Annual tax saving
- Extra super balance after N years (with assumed growth rate, default 7%)
- Break-even analysis: when is the super balance large enough to offset reduced take-home pay

### Novated Lease Calculator

Since you're evaluating (not tracking an existing lease), this is a modelling tool:

**Inputs**: Vehicle price, lease term (years), residual percentage, annual km estimate, running costs (fuel, insurance, rego, maintenance, tyres), your gross salary, marginal tax rate.

**Calculations**:
- Pre-tax lease payment = (vehicle price - residual) / term + finance charges
- GST saving = 1/11 of lease payments and running costs
- Income tax saving = (pre-tax deductions) x marginal tax rate
- FBT (Employee Contribution Method) = statutory fraction x vehicle base value
- Net cost = total payments - tax savings - GST savings + FBT
- Compare vs buying outright (with depreciation)

**Output**: Side-by-side comparison table, monthly cash flow impact, total savings over lease term.

### BTC Loan (Ledn) Tracker

**Inputs**: Loan amount, collateral (BTC), interest rate, Ledn LTV thresholds (50% initial, ~70% margin call, ~80% liquidation).

**Real-time display**:
- Current BTC price (CoinGecko, cached, refreshed every 5 min)
- Current LTV = loan balance / (collateral BTC x BTC price)
- Distance to margin call: price must drop to X for 70% LTV
- Distance to liquidation: price must drop to Y for 80% LTV
- Visual gauge chart showing current LTV position

**Liquidation price formula**: `liquidation_price = loan_balance / (collateral_btc * liquidation_ltv)`

### Budget Forecasting Engine

Simple deterministic projection:

1. Calculate average monthly income/expenses by category over last 3 months
2. Add known future events: upcoming loan payments, salary changes, one-off expenses
3. Project forward month-by-month for 12 months
4. Two scenarios: "at current rate" vs "at budgeted rate"
5. Flag months where projected balance goes below a user-set threshold
6. Render as a line chart with danger zone shading

### CSV Import Pipeline

1. User uploads CSV file
2. Auto-detect format by header row (Macquarie: `Date,Description,Debit,Credit,Balance`)
3. Parse rows into candidate transactions
4. Compute `import_hash` = SHA-256(date + amount + description) per row
5. Check against existing hashes for duplicate detection
6. Auto-categorize using keyword rules (configurable by user): e.g., "WOOLWORTHS" -> Groceries, "SALARY" -> Income
7. Show preview table with suggested categories (user can edit)
8. Confirm import -> insert into `transactions` table

Support additional bank formats later by adding header-pattern matchers.

### Charts and Visualizations (Recharts)

All built with Recharts (free, React-native):

- **Dashboard**: Net worth over time (area), monthly income vs expenses (bar), spending by category (donut)
- **Portfolio**: Asset performance over time (multi-line), asset allocation (pie), gains/losses waterfall
- **Loans**: Amortization schedule (stacked area -- principal vs interest), BTC LTV gauge, mortgage payoff projection
- **Budget**: Budget vs actual (grouped bar), forward projection (line with threshold band)
- **Tax**: Income breakdown (horizontal bar), tax estimate waterfall
- **Super Analysis**: Balance growth over time with fund-switch markers (area), your balance vs AU median/average benchmark (bar), contributions by type per FY (stacked bar), what-if comparison across funds (multi-line), salary sacrifice impact comparison (grouped bar), projected retirement balance scenarios (multi-line with confidence bands)
- **Super Research**: Asset allocation comparison (stacked bar), growth vs defensive splits (grouped bar), fee comparison at multiple balance levels (grouped bar), cumulative fee drag over time (multi-line), interactive fee calculator output

### App Page Structure

```
finance.khufushome.com/
  /                          -> Finance Home (total net worth, asset/liability breakdown, navigation cards)
  /transactions              -> Transaction list, filters, CSV import
  /transactions/new          -> Manual transaction entry
  /accounts                  -> Account list with balances
  /accounts/:id              -> Account detail + recent transactions
  /loans                     -> All loans overview
  /loans/:id                 -> Loan detail (type-specific view)
  /loans/calculator          -> Novated lease calculator
  /portfolio                 -> Holdings, current values, performance
  /portfolio/:id             -> Individual asset detail + trade history
  /super                     -> Super landing (links to Analysis + Research)
  /super/analysis            -> Super Analysis: Overview tab (current balance, AU benchmarks, charts)
  /super/analysis/historical -> Super Analysis: Historical Performance (fund comparison, fund-switch timeline)
  /super/analysis/projections-> Super Analysis: Projections (future balance modelling, scenarios)
  /super/calculator          -> Salary sacrifice calculator
  /super/research            -> Super Research: landing (asset allocations, fee impact, fund papers)
  /super/research/allocations-> Asset allocation comparison across funds
  /super/research/fees       -> Fee impact analysis and calculator
  /super/research/papers     -> Fund research papers (detailed per-fund reports)
  /super/research/papers/:id -> Individual fund research paper
  /budget                    -> Monthly budget setup + tracking
  /budget/forecast           -> Forward projection view
  /tax                       -> Tax year overview
  /tax/:year                 -> Detailed tax breakdown + estimate
  /settings                  -> Categories, CSV mappings, price refresh
```

### Finance Home Page

The finance home page (`/`) is the central hub showing a complete financial picture at a glance:

- **Total Net Worth** card: sum of all assets (cash accounts + investments + crypto + super) minus all liabilities (loans). Large, prominent number with change indicator (vs last month).
- **Breakdown bar**: visual bar showing proportion of net worth by category (Cash, Investments, Super, Property vs Loans).
- **Section navigation cards**: clickable cards linking to each major section (Accounts, Loans, Portfolio, Super, Budget, Tax) with a summary metric per card (e.g., "3 accounts — $42,350", "Super — $119,000", "Loans — $380,000 outstanding").
- **Monthly cash flow summary**: income vs expenses for the current month (from transactions).
- **Alerts**: upcoming payments, budget overruns, LTV warnings, concessional cap approaching.

### Superannuation Section (two pillars)

The super section is split into **Analysis** (your personal super data) and **Research** (market-wide fund comparison done every 6-12 months). Research data is auto-refreshed by the Super Data Pipeline (APRA + ATO APIs) — see above. The `research/super-research/` Python app is a read-only reference for data models and analysis logic; all new code lives in the finance app, `scripts/super-pipeline/`, and `supabase/functions/`.

#### Super Analysis (`/super/analysis`)

Personal super tracking and forward-looking tools:

1. **Overview** (`/super/analysis` default tab)
   - Current balance (from latest `super_balance_history` snapshot)
   - Compare your balance against AU median and average by age group (ATO data from `au_median_balance_by_age.csv`)
   - Bar chart: your balance vs median vs average for your age bracket
   - Contribution summary for current FY (employer SG + salary sacrifice + personal)
   - Concessional cap tracker ($30k/year progress bar)

2. **Historical Performance** (`/super/analysis/historical`)
   - Balance over time chart (from `super_balance_history` snapshots)
   - **Fund switch timeline**: visual markers on the chart showing when you changed funds (Future Super → Hostplus), so before/after performance is clearly delineated
   - Fund-vs-fund comparison: "what if" analysis showing what your balance would have been in alternative funds (ported from the Python `personal_what_if()` logic)
   - Annualised returns comparison table

3. **Projections** (`/super/analysis/projections`)
   - Forward balance projection to retirement age (optimistic / expected / conservative scenarios)
   - Interactive inputs: adjust salary growth, contribution rate, assumed return rate
   - Impact of salary sacrifice on projected retirement balance
   - Ported from Python `project_balance()` and `scenario_projections()` logic

#### Super Research (`/super/research`)

Market-wide fund analysis, refreshed every 6-12 months:

1. **Asset Allocations** (`/super/research/allocations`)
   - Stacked bar chart comparing allocation across funds (AU equities, intl equities, property, infrastructure, private equity, alternatives, fixed income, cash)
   - Growth vs defensive split comparison
   - Data auto-refreshed from APRA Historical SAA CSV via pipeline

2. **Fee Impact** (`/super/research/fees`)
   - Fee comparison bar chart across funds (at $50k, $100k, $200k balances)
   - Interactive fee calculator with balance slider
   - Cumulative fee drag chart over 10/20/30 years
   - Data auto-refreshed from APRA QSPS CSV via pipeline, calculation logic ported from Python `fee_drag_over_time()` to TypeScript

3. **Fund Research Papers** (`/super/research/papers`)
   - List of detailed per-fund research papers (ported from `research/super-research/research/fund_papers/` into `apps/finance/src/content/fund-papers/`)
   - Each paper rendered from Markdown with key metrics, allocation breakdown, pros/cons, suitability assessment
   - 10 funds covered: Future Super, AustralianSuper, Hostplus (Balanced + Shares Plus), UniSuper, ART, Aware, HESTA, Rest, Vanguard

#### Super Reference Data

The `research/super-research/` Python app is a **read-only reference**. Its data and logic are ported into the monorepo:

| Python source (read-only reference) | Finance app destination (where it lives now) |
|---|---|
| `config/funds.yaml` (10 funds) | `scripts/super-pipeline/config.py` (fund ABNs/options for pipeline filtering) + `super_fund_reference` Supabase table |
| `data/returns/annual_returns.csv` | `super_fund_returns` table — auto-refreshed by APRA pipeline (`scripts/super-pipeline/ingest_apra.py`) |
| `data/returns/annualised_returns.csv` | Computed client-side from `super_fund_returns` data |
| `data/allocations/asset_allocations.csv` | `super_fund_allocations` table — auto-refreshed by APRA pipeline |
| `data/fees/fee_structures.csv` | `super_fund_fees` table — auto-refreshed by APRA pipeline |
| `data/benchmarks/au_median_balance_by_age.csv` | Static JSON in `apps/finance/src/data/au-median-balance.json` (updated ~annually from ATO statistics) |
| `research/fund_papers/*.md` (10 papers) | Copied to `apps/finance/src/content/fund-papers/` and rendered via a Markdown renderer |
| `config/personal.yaml` | Initial seed for user's `super_balance_history` + `super_contributions` (one-time via `--seed` flag) |
| `src/analysis.py` logic | Ported to TypeScript in `apps/finance/src/lib/super-analysis.ts` |

Functions ported from Python to TypeScript:
- `project_balance()` → forward balance projection with compound growth
- `personal_what_if()` → what-if analysis across alternative funds
- `fee_drag_over_time()` → cumulative fee impact over N years
- `scenario_projections()` → optimistic/expected/conservative scenarios

### Implementation Sub-Phases

#### Phase 3A: Finance Database + Routing Shell + Home Page

- [x] All Supabase migrations (tables above, including `super_contributions`, `super_balance_history`, `super_yoursuper_status`)
- [x] RLS policies on every finance table (user can only see own data)
- [x] Install TanStack Router + Query in `apps/finance`
- [x] Install Recharts in `apps/finance`
- [x] Create page shells for all routes (empty but navigable, including all `/super/*` sub-routes)
- [x] Sidebar layout with navigation (sections: Home, Accounts, Transactions, Loans, Portfolio, Super, Budget, Tax, Settings)
- [x] Finance Home Page — net worth card, breakdown bar, section navigation cards, monthly cash flow summary

#### Phase 3B: Accounts + Transactions + CSV Import

- [x] Accounts CRUD (create, list, edit, archive)
- [ ] Manual transaction entry form
- [ ] Transactions data table (filterable by date, category, account, type)
- [ ] CSV import pipeline (Macquarie format + generic mapper)
- [ ] Auto-categorization engine with user-editable rules
- [ ] Duplicate detection via `import_hash`

#### Phase 3C: Loans

- [ ] Generic loan CRUD
- [ ] Mortgage detail view with amortization schedule
- [ ] Novated lease calculator/modeller
- [ ] BTC-backed loan tracker with live LTV (CoinGecko integration)
- [ ] Personal loan detail view
- [ ] Loan payment tracking

#### Phase 3D: Portfolio + Price Feeds

- [ ] Asset holdings CRUD
- [ ] Asset transaction entry (buy/sell/dividend)
- [ ] Yahoo Finance integration for ASX/US stocks
- [ ] CoinGecko integration for crypto
- [ ] Price caching in Supabase
- [ ] Portfolio performance charts
- [ ] CGT calculation engine (FIFO method, 50% discount)
- [ ] CGT report view

#### Phase 3E: Super Data Pipeline (automated refresh)

All pipeline code lives in the monorepo. The `research/super-research/` folder is a read-only reference for data models and logic — no new code is added there.

- [x] **`data_pipeline_logs` migration** — Supabase migration for the logging table
- [x] **`scripts/super-pipeline/` setup** — create directory with `pyproject.toml` (managed by `uv`), shared `config.py` (tracked fund ABNs/options, APRA download URLs), `seed.py`, and entry point scripts
- [x] **APRA CSV Ingestion script** (`scripts/super-pipeline/ingest_apra.py`) — Python script that downloads Historical Performance CSV (~70 MB) and Historical SAA CSV (~139 MB) from APRA, parses with pandas, filters for 9 tracked funds by ABN, compounds quarterly returns to annual FY returns, pivots SAA sector data into allocation rows, and upserts into `super_fund_returns` (annual + quarterly_net) and `super_fund_allocations`. Includes deduplication, outlier filtering, and error logging.
- [x] **ATO YourSuper API Edge Function** (`supabase/functions/yoursuper-refresh/`) — TypeScript/Deno function that calls `ato.gov.au/api/v1/YourSuper/APRAData`, matches MySuper products to tracked funds, stores results in `super_yoursuper_status`. Note: Future Super not found in ATO data (its specific MySuper product isn't listed).
- [x] **BTC Price Refresh Edge Function** (`supabase/functions/btc-price-refresh/`) — TypeScript/Deno function that fetches BTC/AUD daily prices from CoinGecko (last 90 days, free tier), extracts the 15th-of-month close price, and upserts into `btc_price_monthly`. Historical data (Oct 2020 – Mar 2026) seeded via migration from Yahoo Finance actual daily closes.
- [x] **Root pnpm scripts** — `pipeline:seed`, `pipeline:apra`, `pipeline:yoursuper`, `pipeline:btc-price`, `functions:serve` (uses `npx supabase`)
- [x] **Schema migrations** — widened `return_pct` to `numeric(10,4)`, allocation columns to `numeric(7,2)`, added `price_date` column rename for BTC prices, extended `super_balance_history` with transaction columns (employer_contribution, salary_sacrifice, member_fee, income_tax, insurance_premium, investment_return)
- [x] **BTC price seed migration** — 66 actual BTC/AUD close prices on the 15th of each month (Oct 2020 – Mar 2026) sourced from Yahoo Finance via `yfinance`. Used for SMSF Bitcoin what-if simulation (contributions land ~15th).
- [x] **Initial seed** — `supabase/seed.sql` seeds dev users, a super account, and 22 quarterly balance snapshots (Sep 2020 – Dec 2025). First 19 quarters estimated from `research/super-research/config/personal.yaml` annual anchors; last 3 quarters (Q2–Q4 2025) use actual transaction data from the user's Future Super account.
- [x] **Supabase cron schedule** — `pg_cron` + `pg_net` migration with `invoke_edge_function()` helper that reads URL/key from Supabase Vault. YourSuper: quarterly on 2nd Jan/Apr/Jul/Oct at 03:00 UTC. BTC price: monthly on 16th at 04:00 UTC. Gracefully skips if vault secrets not configured (local dev).
- [ ] **GitHub Actions cron** (optional) — quarterly workflow that runs the APRA Python script (needs `SUPABASE_SERVICE_ROLE_KEY` secret)
- [x] **Manual trigger + Data freshness UI** — `DataFreshness` component on all Research pages showing last pipeline run status/time for APRA, YourSuper, and BTC pipelines. YourSuper and BTC have "Refresh" buttons that invoke Edge Functions via `supabase.functions.invoke()`. APRA shows `pnpm pipeline:apra` hint (Python script, not an Edge Function). Error messages displayed inline. Polls every 30s.

#### Phase 3F: Super Analysis + Research

- [x] **Balance snapshot tracking** — quarterly snapshot CRUD form in `/super/analysis` with auto-calculated next quarter date (30 Sep, 31 Dec, 31 Mar, 30 Jun). Date locked on create (auto-set to next quarter) and edit. Delete restricted to latest snapshot only. Input validation: balance/employer/fee required ≥ 0, income tax allows negatives (refunds), salary sacrifice and insurance optional. Investment return derived automatically.
- [x] **Analysis — Overview** (`/super/analysis`): current balance card, last employer contribution, last investment return, quarterly snapshots table with edit/delete actions, "New Snapshot" button.
- [x] **Analysis — Historical Performance** (`/super/analysis/historical`): Recharts line chart comparing actual balance vs what-if fund alternatives + SMSF 100% Bitcoin. Fund selector with checkboxes, collapsible "SMSF Bitcoin Assumptions" panel (annual SMSF cost, exchange fee), BTC stats (accumulated BTC, current value, total contributed). Opportunity cost summary table.
- [x] **What-if engine** (`apps/finance/src/lib/super-analysis.ts`): `personalWhatIf()` — uses actual contributions with alternative fund quarterly returns and fees. `smsfBtcWhatIf()` — monthly DCA simulation buying BTC on the 15th with actual prices from Yahoo Finance, deducting SMSF costs ($3,318/yr) and exchange fees (0.5%).
- [x] **Super types + API** (`apps/finance/src/lib/super-types.ts`, `super-api.ts`): TypeScript interfaces for all super data, Supabase client functions for snapshots, fund references, returns, fees, BTC prices.
- [x] **Super landing page** (`/super`): navigation cards linking to all 6 sub-pages (Analysis Overview, Historical Performance, Projections, Research Returns, Allocations, Fees) with icons and descriptions.
- [ ] Super fund accounts (create, switch between Future Super / Hostplus)
- [ ] Contribution entry (employer SG, salary sacrifice, personal) as separate detailed records
- [ ] Concessional cap monitoring ($30k/year with progress bar)
- [ ] AU median/average benchmark comparison on Overview (ATO data from `au_median_balance_by_age.csv`)
- [ ] YourSuper performance test status badge on Overview
- [ ] Fund-switch timeline markers on Historical Performance chart
- [ ] **Analysis — Projections**: forward balance projection (optimistic/expected/conservative), interactive inputs, salary sacrifice impact
- [ ] Salary sacrifice calculator/modeller
- [ ] **Research — Asset Allocations**: stacked bar chart comparing fund allocations, growth vs defensive splits
- [ ] **Research — Fee Impact**: fee comparison bars, interactive calculator, cumulative fee drag
- [ ] **Research — Fund Papers**: render Markdown research papers for each fund
- [ ] **Research — Data freshness indicator**: show last pipeline run date, allow manual refresh

#### Phase 3F-UI: Super Section Navigation UX

- [x] **Sidebar dropdown** — expand "Super" in the sidebar to show sub-page links (Dashboard, Overview, Historical, Projections, Research, Allocations, Fees) as a collapsible sub-menu with animated chevron. Auto-opens when on a `/super/*` route.
- [x] **Breadcrumb/tab navigation** — `SuperNav` component at the top of all `/super/*` sub-pages: breadcrumb linking back to super landing + tabbed navigation between sibling pages (Analysis: Overview/Historical/Projections; Research: Returns/Allocations/Fees). Active tab highlighted with background and shadow.

#### Phase 3G: Budget + Forecasting

- [ ] Budget creation (monthly, by category)
- [ ] Actual vs budget tracking (auto-populated from transactions)
- [ ] Forward projection engine (12-month horizon)
- [ ] Projection chart with danger zone highlighting
- [ ] Budget alerts

#### Phase 3H: Tax + Polish

- [ ] Australian tax calculator (brackets, Medicare levy, salary sacrifice impact)
- [ ] Tax year view with income/deductions/CGT/super summary
- [ ] Estimated tax/refund calculation
- [ ] Income source management
- [ ] Net worth tracking aggregation (accounts + assets + super - loans) powering the Home Page
- [ ] Alerts system (budget overrun, LTV warning, upcoming payments, concessional cap approaching)

### Key Finance Design Decisions

- **All calculations client-side**: Tax, CGT, amortization, LTV, salary sacrifice modelling -- all computed in TypeScript utility functions in `apps/finance/src/lib/`. No server-side compute needed.
- **Super balance is manually tracked, but research data is automated**: Super fund balances are entered from quarterly statements (no fund APIs available). But fund performance, allocations, and fees are auto-refreshed from APRA QSPS CSVs (Python script in `scripts/super-pipeline/`) + ATO YourSuper API (Supabase Edge Function) on a quarterly schedule. This gives us authoritative government data without manual CSV curation.
- **Pipeline code lives in the monorepo**: Python scripts under `scripts/super-pipeline/`, Edge Functions under `supabase/functions/`. The `research/super-research/` folder is read-only reference — no new code goes there. Python is compatible with the stack via `supabase-py` and pnpm wrapper scripts.
- **Price data is cached, not real-time streaming**: Fetch on page load, cache for 5 min. Personal finance doesn't need tick-by-tick data.
- **JSONB for flexible fields**: Loan `extra_data`, tax `deductions`, `other_income` -- avoids schema explosion for type-specific fields while keeping one table per concept.
- **CSV-first, not API-first for bank data**: Bank APIs in Australia (Open Banking/CDR) require accreditation. CSV export is universally available and free. We can add API integrations later if a free option emerges.
- **Tax brackets as config, not hardcoded**: Store AU tax brackets in a TypeScript config object so they can be updated each FY without schema changes.

---

## Phase 4: Main Dashboard App (khufushome.com)

**Goal:** Build the central dashboard as the entry point and hub for all subdomains.

- [ ] Implement TanStack Router with typed routes in `apps/dashboard`
- [ ] Build dashboard home page with:
  - Quick status overview (house status, recent activity)
  - Navigation cards to subdomains (3D View, Finance)
  - User profile / settings section
- [ ] Create user settings page:
  - Profile management (name, avatar)
  - Notification preferences
  - Connected devices summary
  - Session management (active sessions, logout all)
- [ ] Add a global activity feed using Supabase Realtime:
  - Device state changes
  - Finance events
  - System alerts
- [ ] Create Supabase tables for dashboard:

```sql
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  source TEXT NOT NULL,  -- 'threedimension', 'finance', 'system'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- [ ] Wire up TanStack Query for data fetching with Supabase
- [ ] Add RLS policies for all new tables

---

## Phase 5: Home Automation Backend (Home Assistant + MQTT)

**Goal:** Set up the device control infrastructure that the 3D view will interface with.

### UmbrelOS App Store Installs

All three backend services are available as one-click installs on your UmbrelOS home server:

| Service | Umbrel App | Version | Notes |
|---|---|---|---|
| Home Assistant | Available | 2026.2.3+ | One-click install, auto-updates |
| Mosquitto MQTT | Available | 2.0.22+ | One-click install, lightweight broker |
| Cloudflare Tunnel | Available | cloudflared | Requires Cloudflare account + domain |

No custom Docker Compose files needed -- UmbrelOS manages all containers.

### UmbrelOS Considerations

- Apps installed via Umbrel share an internal Docker network; Home Assistant can reach Mosquitto by its container name
- USB device passthrough (Zigbee/Z-Wave sticks) is supported; works best on x86 servers (Pi has some flakiness with USB discovery)
- App configs live in `~/umbrel/app-data/<app-name>/` on the UmbrelOS machine -- you can tweak `configuration.yaml` (HA) or `mosquitto.conf` there
- Portainer is available from the Umbrel App Store if you ever need to run custom containers not in the store

### Configuration Tasks

- [ ] Install Home Assistant from UmbrelOS App Store
- [ ] Install Mosquitto MQTT from UmbrelOS App Store
- [ ] Install Cloudflare Tunnel from UmbrelOS App Store
- [ ] Configure Home Assistant:
  - Enable REST API and WebSocket API
  - Configure MQTT integration pointing to Mosquitto (use container hostname)
  - Set up long-lived access tokens for API auth
  - Configure CORS for `*.khufushome.com`
- [ ] Configure Cloudflare Tunnel to route `ha.khufushome.com` -> Home Assistant (port 8123)
- [ ] Build `packages/home-assistant` client library:
  - REST API client (get states, call services, fire events)
  - WebSocket client (subscribe to state changes in real-time)
  - TypeScript types for HA entities, states, services
  - Connection manager with auto-reconnect
- [ ] Create Supabase tables for device registry:

```sql
CREATE TABLE devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  ha_entity_id TEXT NOT NULL,        -- e.g., 'light.living_room'
  name TEXT NOT NULL,
  device_type TEXT NOT NULL,          -- 'light', 'switch', 'sensor', 'thermostat'
  room TEXT NOT NULL,
  model_object_name TEXT,            -- name in 3D model for linking
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE device_state_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES devices NOT NULL,
  state JSONB NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

- [ ] Create Supabase Edge Function to proxy HA API calls (adds auth layer)
- [ ] Set up MQTT topics structure:
  - `khufushome/{room}/{device_type}/{device_id}/state`
  - `khufushome/{room}/{device_type}/{device_id}/command`
- [ ] Add RLS policies so users only see their own devices
- [ ] Write device discovery and pairing flow

---

## Phase 6: 3D House Visualization (threedimension.khufushome.com)

**Goal:** Create an interactive 3D model of the house with clickable rooms and devices.

- [ ] Install React Three Fiber, @react-three/drei, @react-three/postprocessing in `apps/threedimension`
- [ ] Set up scene architecture:
  - `HouseScene` -- top-level Canvas + lighting + camera
  - `Room` -- individual room meshes with click handlers
  - `DeviceMarker` -- interactive 3D indicators on devices
  - `CameraController` -- orbit controls, zoom to room
- [ ] Create or source a 3D house model:
  - Use Blender to model the house (export as `.glb`)
  - Name each mesh/object meaningfully (e.g., `living_room_light_1`)
  - Store model in `apps/threedimension/public/models/`
- [ ] Implement model loading with `useGLTF` from drei
- [ ] Build interaction system:
  - Click on room -> zoom camera to room, show room devices
  - Click on device marker -> open device control panel
  - Hover effects (glow, highlight) on interactive objects
  - Color-coded states (green = on, grey = off, red = error)
- [ ] Create device control panels (2D overlays on 3D view):
  - Light controls (on/off, brightness, color temperature)
  - Thermostat controls (target temp, mode)
  - Switch controls (on/off toggle)
  - Sensor readouts (temperature, humidity, motion)
- [ ] Build room sidebar with device list for current room
- [ ] Add floor selector for multi-story houses
- [ ] Implement performance optimizations:
  - Level of detail (LOD) for distant objects
  - Instanced meshes for repeated objects
  - Lazy load rooms not in view
- [ ] Connect 3D interactions to `packages/home-assistant` client

---

## Phase 7: Real-Time Device Integration

**Goal:** Connect the 3D view to live device states via Home Assistant WebSocket + Supabase Realtime.

- [ ] Subscribe to Home Assistant WebSocket for real-time state changes
- [ ] Create Zustand store for device states in `apps/threedimension`:

```typescript
interface DeviceStore {
  devices: Map<string, DeviceState>;
  updateDevice: (entityId: string, state: DeviceState) => void;
  subscribeToRoom: (room: string) => void;
}
```

- [ ] Map HA entity state changes to 3D model visual updates:
  - Light on -> mesh emissive material + glow effect
  - Light off -> dark material
  - Thermostat -> color gradient based on temperature
  - Motion sensor -> pulse animation when triggered
- [ ] Implement device command flow:
  - User clicks light in 3D -> control panel opens
  - User toggles switch -> call HA service via Edge Function
  - HA updates state -> WebSocket pushes update -> 3D model updates
- [ ] Add optimistic UI updates (show change immediately, revert on failure)
- [ ] Log all device interactions to `activity_log` table via Supabase
- [ ] Create automation rules UI (basic):
  - "When motion detected in X, turn on light Y"
  - Store rules in Supabase, execute via HA automations
- [ ] Add notification system for device alerts (Supabase Realtime -> toast)
- [ ] Handle offline/disconnected states gracefully

---

## Phase 8: Infrastructure, Deployment, and CI/CD

**Goal:** Deploy frontends to Cloudflare Pages, connect UmbrelOS services via Cloudflare Tunnel, set up CI/CD.

### Cloudflare Pages (Frontend Deployment -- FREE)

All three React apps deploy as static sites to Cloudflare Pages directly from the GitHub repo.

- [ ] Create 3 Cloudflare Pages projects (one per app):
  - `khufushome` -> `khufushome.com` (builds `apps/dashboard`)
  - `khufushome-3d` -> `threedimension.khufushome.com` (builds `apps/threedimension`)
  - `khufushome-finance` -> `finance.khufushome.com` (builds `apps/finance`)
- [ ] Configure each Pages project:
  - **Build command:** `cd ../.. && pnpm turbo build --filter=<app-name>`
  - **Build output:** `apps/<app-name>/dist`
  - **Root directory:** `/` (monorepo root)
  - **Environment variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.
- [ ] Set up custom domains in Cloudflare Pages settings:
  - Each project gets a `*.pages.dev` URL automatically
  - Add custom domain via Pages > Custom domains (auto-configures DNS CNAME)
- [ ] Preview deployments: every PR gets a unique preview URL automatically (free)

### Cloudflare Tunnel via UmbrelOS (Home Assistant -- FREE)

Home Assistant is exposed securely via the Cloudflare Tunnel app installed on UmbrelOS. No ports opened on your router.

- [ ] Install Cloudflare Tunnel app from UmbrelOS App Store (if not done in Phase 5)
- [ ] Configure tunnel in Cloudflare Zero Trust dashboard:
  - Route `ha.khufushome.com` -> Home Assistant (port 8123 inside Umbrel network)
- [ ] Add Cloudflare Access policy (free for up to 50 users):
  - Only allow requests from authenticated users OR from Supabase Edge Functions
  - This adds a zero-trust layer on top of HA's own auth

### Cloudflare DNS Configuration

- [ ] Configure in Cloudflare Dashboard (already managing khufushome.com):
  - `khufushome.com` -> CNAME to Cloudflare Pages (auto-configured)
  - `threedimension.khufushome.com` -> CNAME to Cloudflare Pages (auto-configured)
  - `finance.khufushome.com` -> CNAME to Cloudflare Pages (auto-configured)
  - `ha.khufushome.com` -> CNAME to Cloudflare Tunnel (auto-configured by cloudflared)
- [ ] Enable Cloudflare proxy (orange cloud) on all records for WAF/DDoS protection
- [ ] SSL mode: Full (Strict) -- Cloudflare handles certs automatically

### GitHub Actions CI/CD

- [ ] Set up `.github/workflows/ci.yml`:
  - **On PR:** Lint (Biome) + type-check + Vitest unit tests
  - Cloudflare Pages auto-deploys preview builds on PR (no GH Action needed)
- [ ] Set up `.github/workflows/deploy.yml`:
  - **On push to main:** Cloudflare Pages auto-deploys production (no GH Action needed for frontend)
  - Optionally: run Playwright E2E tests against preview URL before promoting to production
- [ ] Store secrets in GitHub repo settings:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  - `CLOUDFLARE_API_TOKEN` (if using Wrangler CLI for advanced deploys)

### Environment Variables

Follows the strategy defined in "Environment Management and Secrets Strategy" above:

- `config/env.yaml` selects URLs and feature flags based on `KHUFUS_ENV`
- `.env.local` for local secrets (gitignored)
- Cloudflare Pages dashboard for production `VITE_*` env vars (per-project)
- GitHub repo Settings > Secrets for CI pipelines
- Supabase Dashboard > Edge Functions > Secrets for `HA_ACCESS_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY`
- UmbrelOS app configs for HA/MQTT/Tunnel credentials (`~/umbrel/app-data/`)
- Switching: `pnpm dev` = local, `KHUFUS_ENV=prod pnpm dev` = run frontends locally against prod services

### Supabase Production Config

- [ ] Configure allowed redirect URLs for all subdomains
- [ ] Set up email templates for auth flows
- [ ] Enable rate limiting on auth endpoints
- [ ] Consider Supabase Pro for daily backups once in production

---

## Phase 9: Security Hardening, Testing, and Polish

**Goal:** Audit security, add comprehensive tests, and polish the user experience.

- [ ] **Security audit:**
  - Review all RLS policies -- ensure no table is exposed without RLS
  - Audit Supabase Edge Functions for input validation
  - Ensure all API calls go through authenticated routes
  - Review CORS configuration on all services
  - Add rate limiting on auth endpoints (Supabase built-in)
  - Configure Cloudflare security headers (Transform Rules -- free):
    - Content Security Policy (CSP)
    - HSTS (auto-enabled with Cloudflare SSL)
    - X-Frame-Options, X-Content-Type-Options
  - Enable Cloudflare WAF managed rules (free tier)
  - Configure Cloudflare Access policies on ha.khufushome.com
  - Audit Home Assistant access token storage (never in client-side code)
  - Enable Cloudflare Bot Protection (free tier)
- [ ] **Testing:**
  - Unit tests for shared packages (auth hooks, HA client, utilities)
  - Component tests for `packages/ui` using Vitest + Testing Library
  - Integration tests for Supabase queries with test database
  - E2E tests with Playwright:
    - Login flow
    - Device control flow
    - Finance CRUD operations
    - 3D model interaction
- [ ] **Performance:**
  - Lighthouse audit on all apps (target 90+ scores)
  - Optimize 3D model file size (Draco compression for GLB)
  - Implement code splitting per route
  - Add service worker for offline fallback
  - Lazy load heavy components (3D canvas, charts)
- [ ] **Polish:**
  - Add onboarding flow for first-time users
  - Implement keyboard shortcuts for power users
  - Add PWA manifest for mobile home screen install
  - Error tracking setup (Sentry free tier or open-source alternative like GlitchTip)
  - Add `CHANGELOG.md` and semantic versioning
- [ ] **Documentation:**
  - API documentation for Home Assistant integration
  - Setup guide for new device pairing
  - Architecture decision records (ADRs)

---

## Key Security Decisions

- **Auth cookies scoped to `.khufushome.com`** -- enables SSO across subdomains
- **Supabase RLS on every table** -- database-level access control, not just API-level
- **Home Assistant behind Cloudflare Tunnel + Access** -- zero-trust access, no open ports on UmbrelOS server
- **HA API proxied through Supabase Edge Functions** -- HA access tokens never reach the browser
- **Cloudflare SSL (Full Strict)** -- HTTPS everywhere, managed certs, HSTS
- **Cloudflare WAF + DDoS** -- free tier protection on all subdomains
- **MQTT with authentication** -- Mosquitto configured with username/password, no anonymous access, only reachable inside UmbrelOS Docker network (not exposed to internet)
- **Secrets never committed** -- `.env.local` / `.env.prod` gitignored; prod secrets in Cloudflare Pages env vars, GitHub Secrets, Supabase Dashboard, and UmbrelOS app configs
- **Config/secret separation** -- `config/env.yaml` (committed, no secrets) holds URLs and flags; `.env.*` files (gitignored) hold secrets; Zod validates at startup

---

## Supabase Paid Features Worth Considering

- **Supabase Pro ($25/month):** 8GB database, 250GB bandwidth, daily backups, email support -- worth it once you're in production with real device data flowing
- **Custom domain:** if you want `api.khufushome.com` instead of the default Supabase URL
- **Branching (Pro):** useful for testing migrations safely before applying to production
