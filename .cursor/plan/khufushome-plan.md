# KhufusHome -- Home Automation Platform

Build a secure, multi-subdomain home automation platform using a Turborepo monorepo with React/TypeScript frontends, Supabase backend (auth, DB, real-time), Home Assistant for device control, React Three Fiber for 3D house visualization, and a personal finance management app -- all open-source.

## Checklist

- [ ] **Phase 1:** Project Foundation -- Turborepo monorepo, pnpm, Vite apps, shared packages, Biome, Tailwind
- [ ] **Phase 2:** Authentication & Authorization -- Supabase auth, session sharing across subdomains, RLS policies, protected routes
- [ ] **Phase 3:** Shared UI Design System -- shadcn/ui in packages/ui, layouts (AppShell, AuthLayout), dark/light mode, responsive
- [ ] **Phase 4:** Main Dashboard App -- khufushome.com hub, activity feed, user settings, TanStack Router + Query
- [ ] **Phase 5:** Home Automation Backend -- Home Assistant + Mosquitto via UmbrelOS, HA client library, device registry in Supabase
- [ ] **Phase 6:** 3D House Visualization -- React Three Fiber scene, GLB model loading, clickable rooms/devices, control panels
- [ ] **Phase 7:** Real-Time Device Integration -- HA WebSocket subscriptions, Zustand device store, live 3D state updates, automation rules
- [ ] **Phase 8:** Finance App -- Accounts, transactions, loans, tax records, budgets, Recharts visualizations, CSV import
- [ ] **Phase 9:** Infrastructure & Deployment -- Cloudflare Pages (frontends), Cloudflare Tunnel via UmbrelOS, GitHub Actions CI/CD
- [ ] **Phase 10:** Security Hardening & Polish -- Security audit, Vitest + Playwright tests, Lighthouse perf, PWA, onboarding, docs

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
- [ ] Wire up `KHUFUS_ENV` env var switching: `pnpm dev` defaults to local, `KHUFUS_ENV=prod pnpm dev` uses prod config
- [ ] Verify `turbo dev` runs all three apps concurrently on different ports

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

## Phase 2: Supabase Authentication and Authorization

**Goal:** Set up secure authentication with Supabase, shared across all subdomains.

- [ ] Create Supabase project and obtain API keys
- [ ] Install `@supabase/supabase-js` in `packages/auth`
- [ ] Create shared Supabase client factory in `packages/auth/src/client.ts`
- [ ] Implement auth hooks in `packages/auth`:
  - `useAuth()` -- current session, user, loading state
  - `useRequireAuth()` -- redirect to login if not authenticated
  - `useSignIn()` / `useSignUp()` / `useSignOut()`
- [ ] Configure Supabase Auth providers:
  - Email/password (primary)
  - Magic link (passwordless option)
  - OAuth providers (Google, GitHub -- optional, free)
- [ ] Set up session sharing across subdomains:
  - Configure Supabase auth cookie domain to `.khufushome.com`
  - Use `supabase.auth.getSession()` on each app init
- [ ] Create `profiles` table with RLS:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (id = (select auth.uid()));
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = (select auth.uid()));
```

- [ ] Create login/signup pages in `apps/dashboard` (shared across subdomains via redirect)
- [ ] Implement protected route wrapper component in `packages/auth`
- [ ] Add CSRF protection and secure cookie configuration
- [ ] Write first Supabase migration file in `supabase/migrations/`

---

## Phase 3: Shared UI Design System and Layouts

**Goal:** Build a reusable component library and consistent layouts for all apps.

- [ ] Initialize shadcn/ui in `packages/ui` with Tailwind CSS v4
- [ ] Create base theme (colors, typography, spacing) matching a "smart home" aesthetic
- [ ] Build shared layout components:
  - `AppShell` -- sidebar + header + content area
  - `AuthLayout` -- centered card for login/signup
  - `SubdomainNav` -- navigation between khufushome subdomains
- [ ] Add core shared components:
  - `Button`, `Input`, `Card`, `Modal`, `Toast`, `Dropdown`
  - `DataTable` (for finance app)
  - `DeviceCard` (for home automation)
  - `StatusBadge` (online/offline/error states)
- [ ] Create a dark/light mode toggle (persisted in localStorage)
- [ ] Set up component exports from `packages/ui` consumable by all apps
- [ ] Ensure responsive design (mobile-first) for all layouts
- [ ] Add loading skeletons and error boundary components

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

## Phase 8: Finance App (finance.khufushome.com)

**Goal:** Build a personal finance tracker for income, expenses, taxes, and loans.

- [ ] Create Supabase tables for finance:

```sql
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'checking', 'savings', 'credit', 'investment'
  balance NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  account_id UUID REFERENCES accounts NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL,         -- 'income', 'expense', 'transfer'
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT,   -- 'weekly', 'monthly', 'yearly'
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  principal NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,4) NOT NULL,
  term_months INTEGER NOT NULL,
  monthly_payment NUMERIC(12,2),
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE tax_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  year INTEGER NOT NULL,
  gross_income NUMERIC(12,2),
  deductions JSONB DEFAULT '{}',
  tax_paid NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- [ ] Enable RLS on all finance tables (user can only see own data)
- [ ] Build finance app pages:
  - **Dashboard** -- net worth, monthly summary, spending breakdown (charts)
  - **Transactions** -- filterable/sortable data table, add/edit/delete
  - **Accounts** -- list accounts, balances, recent activity
  - **Loans** -- loan tracker with amortization schedule calculator
  - **Tax** -- yearly tax overview, deduction tracking
  - **Budget** -- set monthly budgets per category, track progress
- [ ] Add charts and visualizations using **Recharts** (open-source, React-native):
  - Monthly income vs expenses bar chart
  - Spending by category pie/donut chart
  - Net worth over time line chart
  - Loan payoff projection chart
- [ ] Implement CSV/OFX import for bank transactions
- [ ] Add recurring transaction auto-generation (Supabase Edge Function on cron)
- [ ] Build budget alerts (notify when approaching/exceeding budget)

---

## Phase 9: Infrastructure, Deployment, and CI/CD

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

## Phase 10: Security Hardening, Testing, and Polish

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
