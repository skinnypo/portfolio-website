# 3D Portfolio

A self-hosted developer portfolio with a 3D WebGL experience, chess mini-game, and AI chat. Built with React, Three.js, Express, and PostgreSQL — fully containerized with Docker.

## Features

- 3D character model and interactive WebGL environment (Three.js / React Three Fiber)
- Portfolio sections: bio, projects, experience, tech stack
- Interactive chess game with a built-in engine
- AI chat powered by Google Gemini (visitors can chat with an AI persona of the portfolio owner)
- Contact form with Cloudflare Turnstile CAPTCHA
- Admin panel to manage all content (bio, projects, experience, skills)
- Fully containerized — one `docker compose up` to run everything

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Three.js, GSAP |
| Backend | Node 20, Express 4, Prisma 6 |
| Database | PostgreSQL 16 |
| AI | Google Gemini 2.0 Flash |
| Infra | Docker Compose, nginx |

## Quick start

### Prerequisites

- Docker and Docker Compose
- Node 20 + pnpm (for local development only)

### 1. Clone and configure

```bash
git clone <repo-url>
cd 3d-portfolio
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```env
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-long-random-string
ADMIN_PASSWORD=your-admin-password
GEMINI_API_KEY=AIza...          # get free at aistudio.google.com
ALLOW_ORIGIN=https://yourdomain.com
VITE_SITE_URL=https://yourdomain.com
```

### 2. Run

```bash
docker compose up --build
```

Open [http://localhost](http://localhost). The admin panel is at [http://localhost/admin](http://localhost/admin).

### 3. Seed content

On first run the backend entrypoint automatically seeds the database with default content. Log in to `/admin` with the `ADMIN_PASSWORD` from your `.env` to update your bio, projects, and experience.

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
| [Content Management](docs/content-management.md) | Using the admin panel |

## Project structure

```
/
├── backend/                 Express API + Prisma
│   ├── src/
│   │   ├── routes/          API route handlers
│   │   ├── repositories/    Prisma data access layer
│   │   ├── middleware/       JWT auth middleware
│   │   └── lib/             Prisma client singleton
│   └── prisma/              Schema + migrations + seed
├── frontend/                React + Three.js SPA
│   ├── src/
│   │   ├── components/      UI and 3D components
│   │   ├── pages/           Route-level page components
│   │   ├── data/            Build-time content (content.json)
│   │   └── utils/           Chess engine, text splitter
│   └── scripts/             fetch-content.mjs (build-time DB fetch)
├── nginx/                   Production reverse proxy config
├── docker-compose.yml
├── Makefile
└── .env.example
```

## License

MIT
