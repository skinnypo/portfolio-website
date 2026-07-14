# Development Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm i -g pnpm` |
| Docker + Compose | latest | [docker.com](https://docker.com) |
| PostgreSQL (optional) | 16 | local install or use Docker |

## First-time setup

```bash
# 1. Clone
git clone <repo-url>
cd 3d-portfolio

# 2. Install workspace dependencies
make install
# equivalent: pnpm install

# 3. Copy and fill env
cp .env.example .env
```

Minimum required `.env` values for local dev:

```env
DATABASE_URL=postgresql://portfolio:changeme@localhost:5432/portfolio
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=changeme
POSTGRES_DB=portfolio
POSTGRES_HOST=localhost
STRAPI_DATABASE_URL=postgresql://portfolio:changeme@postgres:5432/strapi
STRAPI_APP_KEYS=dev-key-one,dev-key-two
STRAPI_ADMIN_JWT_SECRET=dev-random-string
STRAPI_API_TOKEN_SALT=dev-random-string
STRAPI_TRANSFER_TOKEN_SALT=dev-random-string
STRAPI_JWT_SECRET=dev-random-string
STRAPI_ENCRYPTION_KEY=dev-random-string
ALLOW_ORIGIN=http://localhost:5173
```

`DATABASE_URL` uses `localhost` because it's only ever read by Prisma CLI commands running natively on your host (`make db-migrate`, `make db-studio`) — Postgres's port is published to the host by `docker-compose.dev.yml`. `STRAPI_DATABASE_URL` must use `postgres` (the Compose service name) instead, because it's only ever read by the Dockerized `strapi` service, which resolves `postgres` via Docker's internal DNS, not `localhost`. Don't swap these — `localhost` inside the `strapi` container resolves to the container itself, not the Postgres container, and Strapi will fail its healthcheck (which also blocks `frontend-builder` in Option A below, since it depends on `strapi` being healthy).

`GEMINI_API_KEY` is needed for the AI chat to work. All other optional keys (`GMAIL_*`, `TURNSTILE_*`, `VITE_GA_ID`) can be left empty — those features degrade gracefully. Leave `STRAPI_API_TOKEN` blank for now — you'll generate it in the next step.

### 4. Start Strapi and create your admin account + API token

```bash
make dev-db                                # postgres only
docker compose -f docker-compose.dev.yml up -d --wait postgres  # wait for the healthcheck before continuing
make dev-db-create-strapi                  # one-time, only if reusing an existing volume
docker compose -f docker-compose.dev.yml up -d strapi
```

Visit `http://localhost:1337/admin`, complete the setup wizard to create your admin account, then create a **Read-only** API token under Settings → API Tokens and set it as `STRAPI_API_TOKEN` in `.env`. `frontend-builder` and the local `fetch-content.mjs` script both need this token to read content.

## Option A — Docker (simplest)

```bash
make dev-up
```

This builds and starts the full dev stack (`postgres`, `backend`, `strapi`, `frontend-builder`, `nginx`) from `docker-compose.dev.yml`. Visit [http://localhost](http://localhost). The CMS admin is at [http://localhost/cms/admin](http://localhost/cms/admin).

To see logs:
```bash
docker compose -f docker-compose.dev.yml logs -f           # all services
docker compose -f docker-compose.dev.yml logs -f backend   # backend only
docker compose -f docker-compose.dev.yml logs -f strapi    # strapi only
```

To stop:
```bash
make dev-down
```

## Option B — Local (faster iteration)

Run the database and Strapi via Docker, backend and frontend natively.

### 1. Start PostgreSQL and Strapi

```bash
make dev-db
docker compose -f docker-compose.dev.yml up -d strapi
```

(Already running if you completed step 4 of First-time setup above.)

### 2. Run backend migrations and seed

```bash
make db-migrate    # prisma migrate dev
make db-seed       # no-op — content and admin credentials now live in Strapi
```

### 3. Start backend

```bash
make dev-backend
# runs: pnpm --filter portfolio-backend run dev
# starts: tsx watch src/index.ts on port 3000
```

### 4. Fetch content and start frontend

The frontend needs `src/data/content.json` to exist. `fetch-content.mjs` reads `STRAPI_URL`/`STRAPI_API_TOKEN` straight from the process environment (it does not load `.env` itself), and defaults `STRAPI_URL` to the Docker-internal `http://strapi:1337` — override it for a natively-running Strapi:

```bash
cd frontend
STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<your-token-from-first-time-setup> node scripts/fetch-content.mjs
cd ..
```

Then start Vite:

```bash
make dev-frontend
# runs: pnpm --filter portfolio-frontend run dev
# starts: Vite at http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:3000`, so both dev servers work together.

## Database management

```bash
make db-migrate    # create and apply a new migration (prompts for name)
make db-seed       # no-op — content and admin credentials now live in Strapi
make db-studio     # open Prisma Studio at http://localhost:5555
make db-reset      # drop + recreate DB, migrate, seed (destructive)
```

### Creating a new migration

After editing `backend/prisma/schema.prisma`:

```bash
make db-migrate
# Prisma prompts: "Name for migration" → e.g. "add_blog_table"
```

This generates a SQL file in `backend/prisma/migrations/` and applies it to the local DB.

## Project structure in depth

```
frontend/src/
├── components/        UI components (Navbar, About, Career, Work, etc.)
│   └── styles/        Per-component CSS files
├── pages/
│   ├── MyWorks.tsx    Projects gallery
│   └── Play.tsx       Chess + AI chat
├── data/
│   ├── index.ts       Re-exports content.json as typed SiteContent
│   ├── types.ts       TypeScript interfaces for all content
│   └── content.json   Generated at build time (git-ignored)
├── context/
│   └── LoadingProvider.tsx  Loading screen state
└── utils/
    ├── redoxchessEngine.ts  Stockfish wrapper
    └── textSplitter.ts      GSAP text animation helper

backend/src/
├── routes/
│   ├── contact.ts     Public contact form endpoint
│   └── chat.ts        Public AI chat proxy endpoint
├── middleware/
│   └── rateLimiter.ts Rate limiting
└── seed.ts            No-op — content and admin credentials now live in Strapi

strapi/src/api/
├── bio/                Single type: fullName, nickName, title, headline, description,
│                       location, email, github, linkedin, twitter, facebook, instagram, photo
├── project/            Collection type: title, category, technologies, image, description, order
├── experience/         Collection type: position, company, period, location, description,
│                       responsibilities, technologies, order
└── skill/              Collection type: category, name, order
```

There is no `frontend/src/pages/Admin.tsx`, `backend/src/routes/admin/`, or `backend/src/middleware/auth.ts` anymore — all removed when content management moved to Strapi.

## Content update workflow

Because content is baked at build time, changes made in the Strapi admin only appear on the live site after a rebuild:

```bash
# 1. Make changes in the Strapi admin at /cms/admin
# 2. Rebuild frontend-builder
make rebuild-content
```

`make rebuild-content` targets `docker-compose.prod.yml` only — it's for production. If you're on the dev stack (Option A), rebuild the dev `frontend-builder` directly instead:

```bash
docker compose -f docker-compose.dev.yml up -d --force-recreate frontend-builder
```

In production nginx runs natively on the host and reads the rebuilt files straight off disk, so no restart is needed — see [deployment.md](deployment.md). In production you'd typically automate the rebuild step with a webhook or a manual deploy trigger.

## Environment variables reference

See [`.env.example`](../.env.example) for all keys with comments. Key notes:

- `VITE_*` variables are baked into the frontend JS bundle at build time. Changing them requires a frontend rebuild.
- `ALLOW_ORIGIN` is a comma-separated list: `http://localhost:5173,https://yourdomain.com`
- Use a Gmail **App Password** (not your account password) for `GMAIL_APP_PASSWORD`. Enable 2FA on your Google account first, then create an app password at myaccount.google.com/apppasswords.

## Linting

```bash
make lint
# runs eslint on frontend/src
```

The project uses `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`. No backend linter is configured yet.

## Troubleshooting

### `pnpm-lock.yaml not found` during Docker build
The lockfile must be in the Docker build context. Ensure `.dockerignore` does not exclude `pnpm-lock.yaml`. (This was a known bug — fixed.)

### `content.json not found` or import error
Run `node scripts/fetch-content.mjs` from the `frontend/` directory, ensuring `STRAPI_URL` and `STRAPI_API_TOKEN` are set in the process environment (see Option B, step 4 above).

### Backend won't start: `Cannot find module './routes/chat.js'`
Run `make install` — the TypeScript source needs to be compiled or run via `tsx`. The `dev` script uses `tsx watch` which compiles on the fly.

### Prisma client out of date
Run `pnpm --filter portfolio-backend exec prisma generate` after any schema change.

### Port 3000 already in use
Something else is using port 3000. Either stop it or change `PORT` in `.env`.
