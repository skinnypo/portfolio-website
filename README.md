# 3D Portfolio

A self-hosted developer portfolio with a 3D WebGL experience, chess mini-game, and AI chat. Built with React, Three.js, Express, Strapi CMS, and PostgreSQL — fully containerized with Docker.

## Features

- 3D character model and interactive WebGL environment (Three.js / React Three Fiber)
- Portfolio sections: bio, projects, experience, tech stack
- Interactive chess game with a built-in engine
- AI chat powered by Google Gemini (visitors can chat with an AI persona of the portfolio owner)
- Contact form with Cloudflare Turnstile CAPTCHA
- Strapi CMS admin to manage all content (bio, projects, experience, skills)
- Fully containerized with Docker Compose (`make up-build` / `make dev-up`)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Three.js, GSAP |
| Backend | Node 22, Express 4, Prisma 6 |
| CMS | Strapi 5 |
| Database | PostgreSQL 16 |
| AI | Google Gemini 2.0 Flash |
| Infra | Docker Compose, nginx |

## Quick start

### Prerequisites

- Docker and Docker Compose
- Node 22 + pnpm (for local development only)

### 1. Clone and configure

```bash
git clone <repo-url>
cd 3d-portfolio
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```env
POSTGRES_PASSWORD=your-secure-password
STRAPI_APP_KEYS=<two-random-strings-comma-separated>
STRAPI_ADMIN_JWT_SECRET=<random-string>
STRAPI_API_TOKEN_SALT=<random-string>
STRAPI_TRANSFER_TOKEN_SALT=<random-string>
STRAPI_JWT_SECRET=<random-string>
STRAPI_ENCRYPTION_KEY=<random-string>
GEMINI_API_KEY=AIza...          # get free at aistudio.google.com
ALLOW_ORIGIN=https://yourdomain.com
VITE_SITE_URL=https://yourdomain.com
```

`DATABASE_URL` and `STRAPI_DATABASE_URL` embed the Postgres password as a literal string (`.env` has no variable interpolation) — if you change `POSTGRES_PASSWORD` from the default, update the password inside both URLs to match, or Strapi/Prisma will fail to authenticate against Postgres.

### 2. First run: create your Strapi admin + API token

`frontend-builder` needs a Strapi read-only API token to fetch content, so Strapi has to come up (and be given a token) before the first full build:

```bash
docker compose -f docker-compose.dev.yml up -d postgres strapi
```

Visit `http://localhost:1337/admin`, complete the setup wizard to create your admin account, then go to Settings → API Tokens, create a **Read-only** token, and set it as `STRAPI_API_TOKEN` in `.env`.

### 3. Add content and build

Add your bio, projects, experience, and skills in the Strapi admin UI, then build and start everything:

```bash
make dev-up
```

This builds all images from source (`docker-compose.dev.yml`) and starts `postgres`, `backend`, `strapi`, `frontend-builder`, and `nginx` — open [http://localhost](http://localhost) once it's up. `make dev-up` is for trying the project locally; production deployment uses prebuilt images (`docker-compose.prod.yml`, no bundled nginx) and is covered in the [Deployment Guide](docs/deployment.md).

## Local development

```bash
make install        # install dependencies
make dev-backend    # start Express in watch mode
make dev-frontend   # start Vite dev server at :5173
```

See `make help` for all available targets.

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System design, data flow, service topology |
| [API Reference](docs/api.md) | All backend endpoints |
| [Development Guide](docs/development.md) | Local setup, workflows, troubleshooting |
| [Deployment Guide](docs/deployment.md) | Production deployment on a VPS |
| [Content Management](docs/content-management.md) | Using the Strapi CMS |

## Project structure

```
/
├── backend/                 Express API (contact + chat routes only)
│   ├── src/
│   │   ├── routes/          contact.ts, chat.ts
│   │   └── middleware/      Rate limiting
│   └── prisma/              Schema (no models currently) + no-op seed
├── strapi/                  Strapi CMS (content types: bio, project, experience, skill)
├── frontend/                React + Three.js SPA
│   ├── src/
│   │   ├── components/      UI and 3D components
│   │   ├── pages/           Route-level page components
│   │   ├── data/            Build-time content (content.json)
│   │   └── utils/           Chess engine, text splitter
│   └── scripts/             fetch-content.mjs (build-time Strapi REST API fetch)
├── nginx/                   Reverse proxy config (also proxies /cms/* to Strapi)
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Makefile
└── .env.example
```

## License

MIT
