# KhufusHome

A secure, multi-subdomain home automation platform built as a Turborepo monorepo with React/TypeScript frontends, Supabase backend, Home Assistant device control, React Three Fiber 3D visualization, and personal finance management.

## Subdomains

| App | Subdomain | Description |
|---|---|---|
| Dashboard | `khufushome.com` | Main hub, activity feed, user settings |
| 3D View | `threedimension.khufushome.com` | Interactive 3D house visualization |
| Finance | `finance.khufushome.com` | Personal finance tracker |
| Home Assistant | `ha.khufushome.com` | Device API (via Cloudflare Tunnel) |

## Tech Stack

| Layer | Tool |
|---|---|
| Monorepo | Turborepo + pnpm |
| Frontend | Vite + React 19 + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| Routing | TanStack Router |
| State | Zustand |
| Data Fetching | TanStack Query |
| Auth / DB | Supabase |
| 3D | React Three Fiber |
| Home Automation | Home Assistant + MQTT |
| Hosting | Cloudflare Pages (free) |
| Home Server | UmbrelOS |
| Linting | Biome |
| Testing | Vitest + Playwright |

## Monorepo Structure

```
khufushome/
├── apps/
│   ├── dashboard/          # khufushome.com
│   ├── threedimension/     # threedimension.khufushome.com
│   └── finance/            # finance.khufushome.com
├── packages/
│   ├── ui/                 # Shared component library (shadcn/ui)
│   ├── auth/               # Supabase auth client + hooks
│   ├── types/              # Shared TypeScript types
│   ├── config/             # Shared configs (tsconfig, tailwind, env loader)
│   └── home-assistant/     # HA REST + WebSocket client
├── config/
│   └── env.yaml            # Non-secret environment config (committed)
├── supabase/
│   ├── migrations/         # SQL migrations
│   └── seed.sql            # Dev seed data
├── turbo.json
├── biome.json
├── pnpm-workspace.yaml
├── .env.example            # Template for required secrets
└── .env.local              # Local secrets (gitignored)
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) (managed via corepack)

### Setup

```bash
# Clone the repo
git clone https://github.com/webtalon-admin/khufushome.git
cd khufushome

# Enable pnpm via corepack
corepack enable

# Install dependencies
pnpm install

# Copy environment template and fill in your secrets
cp .env.example .env.local
```

### Development

```bash
# Start all apps concurrently
pnpm dev

# Start a specific app
pnpm turbo dev --filter=@khufushome/dashboard
```

| App | Port |
|---|---|
| Dashboard | http://localhost:5173 |
| 3D View | http://localhost:5174 |
| Finance | http://localhost:5175 |

### Build

```bash
# Build all apps
pnpm build

# Build a specific app
pnpm turbo build --filter=@khufushome/finance
```

### Lint & Format

```bash
# Lint all workspaces
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Check formatting
pnpm format:check

# Auto-format
pnpm format
```

### Type Check

```bash
pnpm typecheck
```

## Environment Configuration

KhufusHome uses a two-layer config system:

1. **`config/env.yaml`** (committed) — non-secret URLs and feature flags, switched by `KHUFUS_ENV`
2. **`.env.local`** (gitignored) — secrets (API keys, tokens, passwords)

Set `KHUFUS_ENV=local` (default) or `KHUFUS_ENV=prod` to switch environments:

```bash
# Local development (default)
pnpm dev

# Local frontends against prod services
KHUFUS_ENV=prod pnpm dev
```

See `.env.example` for all required environment variables.

## Deployment

- **Frontends** deploy to [Cloudflare Pages](https://pages.cloudflare.com/) (free) — auto-deploy on push to main
- **Home Assistant** runs on [UmbrelOS](https://umbrel.com/) and is exposed via [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) (free, no open ports)
- **Database/Auth** hosted on [Supabase](https://supabase.com/) (free tier)

## License

Private — all rights reserved.
