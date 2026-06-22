# Development Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
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
JWT_SECRET=any-long-random-string
ADMIN_PASSWORD=your-admin-password
ALLOW_ORIGIN=http://localhost:5173
```

`GEMINI_API_KEY` is needed for the AI chat to work. All other optional keys (`GMAIL_*`, `TURNSTILE_*`, `VITE_GA_ID`) can be left empty — those features degrade gracefully.

## Option A — Docker (simplest)

```bash
make up-build
```

This builds everything and starts all services. Visit [http://localhost](http://localhost).

To see logs:
```bash
make logs          # all services
make logs-backend  # backend only
```

To stop:
```bash
make down
```

## Option B — Local (faster iteration)

Run the database via Docker, backend and frontend natively.

### 1. Start PostgreSQL only

```bash
docker compose up postgres -d
```

### 2. Run migrations and seed

```bash
make db-migrate    # prisma migrate dev
make db-seed       # seed admin credentials + sample data
```

### 3. Start backend

```bash
make dev-backend
# runs: pnpm --filter portfolio-backend run dev
# starts: tsx watch src/index.ts on port 3000
```

### 4. Fetch content and start frontend

The frontend needs `src/data/content.json` to exist. Run the fetch script once:

```bash
cd frontend && node scripts/fetch-content.mjs && cd ..
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
make db-seed       # re-run seed (idempotent — won't duplicate credentials)
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
│   ├── Admin.tsx      Content management panel
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
│   ├── admin/         Protected CRUD routes (bio, projects, experience, skills, upload)
│   ├── contact.ts     Public contact form endpoint
│   └── chat.ts        Public AI chat proxy endpoint
├── repositories/      Thin Prisma wrappers (findAll, create, update, remove)
├── middleware/
│   └── auth.ts        JWT verification middleware
└── lib/
    └── prisma.ts      Prisma client singleton
```

## Content update workflow

Because content is baked at build time, changes made via the Admin panel only appear on the live site after a rebuild:

```bash
# 1. Make changes in /admin panel
# 2. Rebuild frontend-builder
docker compose up frontend-builder --build
# 3. Restart nginx to pick up new files (usually automatic via volume)
docker compose restart nginx
```

In production you'd typically automate this with a webhook or a manual deploy trigger.

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
Run `node scripts/fetch-content.mjs` from the `frontend/` directory, or ensure `DATABASE_URL` is set.

### Backend won't start: `Cannot find module './routes/chat.js'`
Run `make install` — the TypeScript source needs to be compiled or run via `tsx`. The `dev` script uses `tsx watch` which compiles on the fly.

### Prisma client out of date
Run `pnpm --filter portfolio-backend exec prisma generate` after any schema change.

### Port 3000 already in use
Something else is using port 3000. Either stop it or change `PORT` in `.env`.
