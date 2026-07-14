# Deployment Guide

This guide covers deploying to a Linux VPS using Docker Compose. The setup runs fully on a single machine.

## Prerequisites

- A VPS with at least 1 GB RAM and 10 GB disk (2 GB RAM recommended for smooth builds)
- Ubuntu 22.04 / Debian 12 (or any distro with Docker support)
- A domain name pointed at the server's IP
- Docker and Docker Compose installed
- nginx installed natively on the host (not run in Docker in production — see step 3 below)

### Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

## Initial deployment

### 1. Clone the repo

```bash
git clone <repo-url>
cd 3d-portfolio
```

### 2. Configure environment

```bash
cp .env.example .env
nano .env
```

Required values for production:

```env
# PostgreSQL
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=portfolio
POSTGRES_HOST=postgres

# Prisma (backend — schema currently has no models)
DATABASE_URL=postgresql://portfolio:<password>@postgres:5432/portfolio

# Backend
PORT=3000

# Strapi CMS — separate database on the same Postgres instance
STRAPI_DATABASE_URL=postgresql://portfolio:<password>@postgres:5432/strapi
STRAPI_APP_KEYS=<random-string>,<random-string>
STRAPI_ADMIN_JWT_SECRET=<random-string>
STRAPI_API_TOKEN_SALT=<random-string>
STRAPI_TRANSFER_TOKEN_SALT=<random-string>
STRAPI_JWT_SECRET=<random-string>
STRAPI_ENCRYPTION_KEY=<random-string>
# Filled in after first Strapi login — see step 4 below
STRAPI_API_TOKEN=

# CORS — your public domain
ALLOW_ORIGIN=https://yourdomain.com

# Gmail (for contact form)
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=<secret>
VITE_TURNSTILE_SITE_KEY=<site-key>

# Google Gemini
GEMINI_API_KEY=AIza...

# Optional
VITE_GA_ID=G-XXXXXXXXXX
VITE_SITE_URL=https://yourdomain.com
```

Generate each `STRAPI_*` secret separately:
```bash
openssl rand -base64 32
```

(`STRAPI_APP_KEYS` needs two comma-separated values; run the command twice.)

### 3. Set up native nginx

`docker-compose.prod.yml` does not run nginx — only `postgres`, `backend`, `strapi`, and `frontend-builder` run in Docker. nginx runs as a native host service, proxying to the ports those containers publish to `127.0.0.1` (backend `:3000`, strapi `:1337`) and serving static files straight from the host paths Docker writes to (`/home/deploy/dist`, `/home/deploy/strapi-uploads`).

```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/yourdomain.com` following `nginx/nginx.conf`'s routing rules (`/api/*` → `127.0.0.1:3000`, `/cms/*` and `/uploads/*` → `127.0.0.1:1337` with the `/cms` prefix stripped, everything else → `root /home/deploy/dist` with SPA fallback), then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Add HTTPS once the site is reachable over plain HTTP — see the [HTTPS section](#https-with-nginx--lets-encrypt) below.

### 4. Start Postgres

```bash
docker compose -f docker-compose.prod.yml up -d --wait postgres
```

`--wait` blocks until Postgres reports healthy — step 5 execs into this container and will fail with a connection error if it isn't ready yet.

### 5. Create the Strapi database on an existing volume (if applicable)

`postgres/initdb.d` only runs against a **fresh** Postgres volume. If you're deploying against an already-initialized volume, create the `strapi` database once (requires postgres from step 4 to already be running):

```bash
make db-create-strapi
```

### 6. Start Strapi and create your admin account

```bash
docker compose -f docker-compose.prod.yml up -d strapi
```

Once nginx (step 3) is proxying `/cms/*`, visit `http://yourdomain.com/cms/admin` and complete the Strapi setup wizard to create your admin account — Strapi has its own auth, unrelated to any backend env var. Then go to Settings → API Tokens, create a **Read-only** token, and set it as `STRAPI_API_TOKEN` in `.env`.

### 7. Build and start everything

```bash
make up-build
```

This will:
1. Start PostgreSQL and wait until healthy
2. Start the backend (health-checked) and Strapi (health-checked) in parallel
3. Run the frontend builder (fetches content from Strapi's REST API using `STRAPI_API_TOKEN`, builds the Vite app, copies it to `/home/deploy/dist`) — this depends on Strapi being healthy

nginx (already running from step 3) picks up the built files immediately since it reads straight from `/home/deploy/dist`.

Check status:
```bash
docker compose -f docker-compose.prod.yml ps
make logs
```

### 8. Add initial content

Add your bio, projects, experience, and skills in the Strapi admin UI at `http://yourdomain.com/cms/admin`.

After saving content, trigger a frontend rebuild to publish it:

```bash
make rebuild-content
```

## HTTPS with nginx + Let's Encrypt

This assumes native nginx is already installed and proxying plain HTTP, per the [Set up native nginx](#3-set-up-native-nginx) step above.

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### 2. Configure the site and obtain a certificate

Create `/etc/nginx/sites-available/yourdomain.com` following `nginx/nginx.conf`'s routing rules, adapted for the host: `proxy_pass http://127.0.0.1:3000` for `/api/*`, `proxy_pass http://127.0.0.1:1337` for `/cms/*` (stripping the prefix) and `/uploads/*`, and `root /home/deploy/dist` for the SPA. Enable the site, then:

```bash
sudo certbot --nginx -d yourdomain.com
```

`certbot --nginx` edits the config in place to add the HTTPS server block and HTTP→HTTPS redirect.

### 3. Auto-renew

Certbot installs its own systemd timer (or cron entry, depending on distro) on install. Verify it:

```bash
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```

## Updating the application

The `deploy` Makefile target automates the full flow below (build, push, SSH, pull, restart) — see the [Makefile](../Makefile). The manual steps:

### Code update (new features/fixes)

```bash
git pull
make up-build
```

### Content-only update (bio, projects changed via Strapi admin)

```bash
make rebuild-content
```

No nginx restart needed — it isn't a Docker service in prod and reads the rebuilt files straight off disk.

### Database migration only

If a new release includes schema changes, migrations run automatically when the backend container starts (via `backend/entrypoint.sh`, which runs `prisma migrate deploy` before starting the server).

## Backups

### Database backup

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U portfolio portfolio > backup-$(date +%Y%m%d).sql
```

Strapi's database lives on the same Postgres instance under a separate `strapi` database — back it up the same way:

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U portfolio strapi > backup-strapi-$(date +%Y%m%d).sql
```

### Database restore

```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U portfolio portfolio < backup-20250101.sql
```

### Uploads backup

Strapi's media library is a host bind mount in prod (not a named Docker volume), so back it up directly:

```bash
tar czf uploads-$(date +%Y%m%d).tar.gz -C /home/deploy/strapi-uploads .
```

## Monitoring

### Check service health

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3000/api/health   # backend, published to 127.0.0.1
curl http://localhost:1337/_health      # strapi, published to 127.0.0.1
```

### View logs

```bash
make logs-backend
make logs-strapi
sudo journalctl -u nginx -f   # nginx runs as a native systemd service in prod, not Docker
```

### Resource usage

```bash
docker stats
```

## Common production issues

### Frontend shows stale content after a Strapi content update
Content is baked at build time. Run `make rebuild-content` to rebuild with the latest Strapi content.

### Backend OOM during build
The `frontend-builder` is memory-intensive (Three.js + Terser). If it OOM-kills on a 1 GB VPS, add swap:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Container restarts in a loop
```bash
make logs-backend   # check for migration errors or bad env vars
make logs-strapi    # check for missing STRAPI_* secrets
```

Most common causes: `DATABASE_URL` or `STRAPI_DATABASE_URL` wrong, a missing `STRAPI_*` secret, or PostgreSQL not yet ready (increase `start_period` in the healthchecks if needed).
