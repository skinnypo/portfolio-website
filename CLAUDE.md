# CLAUDE.md — Project Instructions

This file governs Claude's behavior in this repository. Read it before taking any action.

## Project overview

A self-hosted 3D developer portfolio. Key architectural constraint: **content is baked at build time** — the frontend fetches from the database once during the Docker build and outputs a static JSON file. There is no runtime API call to the backend for page content.

## Monorepo layout

```
/                   ← repo root (pnpm workspace)
├── backend/        ← Express + Prisma + PostgreSQL (port 3000)
├── frontend/       ← Vite + React + Three.js (port 5173 dev)
├── nginx/          ← Reverse proxy config (prod only)
├── docker-compose.yml
├── Makefile        ← all common dev tasks
└── .env            ← single env file for all services
```

## Common commands

Use `make help` to see all targets. The most frequent ones:

```bash
make install        # pnpm install workspace deps
make dev-backend    # tsx watch (requires .env with DATABASE_URL)
make dev-frontend   # vite --host
make up-build       # full Docker rebuild + start
make db-migrate     # prisma migrate dev
make db-seed        # seed admin credentials + sample content
make db-studio      # Prisma Studio UI
```

## Backend conventions

- **Framework**: Express 4 (Node 20)
- **ORM**: Prisma 6 with PostgreSQL 16
- **Validation**: always use Zod `safeParse` — never trust `req.body` directly
- **Error handling**: every async route handler must wrap its body in `try { ... } catch (err) { next(err) }` — Express 4 does not catch async rejections automatically
- **Error responses**: always `{ error: string }` shape
- **Auth**: JWT via `jose`, verified by `authMiddleware` — all `/api/admin/*` routes except `/api/admin/login` require it
- **Public routes**: `/api/health`, `/api/contact`, `/api/chat` — no auth

## Frontend conventions

- **Framework**: React 18 + TypeScript + Vite
- **3D**: Three.js via `@react-three/fiber` and `@react-three/drei`
- **Routing**: React Router v7 (file-based pages under `src/pages/`)
- **Content**: imported from `src/data/content.json` (generated at build time by `scripts/fetch-content.mjs`) — never fetch content at runtime
- **API calls**: always check `response.ok` before parsing JSON; surface real error messages from `{ error }` responses instead of showing a generic fallback
- **Double-submit prevention**: use `useRef` guards (not state) for async form/chat handlers — state updates are async and can't prevent a second fire synchronously
- **No comments**: only add a comment when the WHY is non-obvious

## Environment variables

Single `.env` at the repo root is shared by all services (Docker reads it via `env_file`). See `.env.example` for all keys. Key groups:

| Prefix | Used by |
|---|---|
| `POSTGRES_*` | Docker postgres service |
| `DATABASE_URL` | Backend Prisma |
| `JWT_SECRET`, `ADMIN_PASSWORD` | Backend auth |
| `ALLOW_ORIGIN` | Backend CORS |
| `GMAIL_*` | Backend contact route |
| `TURNSTILE_*` | Backend + Frontend (CAPTCHA) |
| `GEMINI_API_KEY` | Backend chat route |
| `VITE_*` | Frontend (baked into JS bundle at build) |

## Docker service order

`postgres` → `backend` (health-checked) → `frontend-builder` (build only, exits) → `nginx`

The `frontend-builder` service runs the build and writes static files to the `frontend_dist` shared volume. `nginx` serves those files.

## What NOT to do

- Do not add `console.log` to production code — logs are stripped by Terser in the frontend build
- Do not call backend APIs for content at runtime — use the baked `content.json`
- Do not add error handling for impossible states — trust Express middleware and Prisma types
- Do not create planning or analysis documents unless asked — work from conversation context
- Do not skip Zod validation on any public endpoint
