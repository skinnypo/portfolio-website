# Deployment Guide

This guide covers deploying to a Linux VPS using Docker Compose. The setup runs fully on a single machine.

## Prerequisites

- A VPS with at least 1 GB RAM and 10 GB disk (2 GB RAM recommended for smooth builds)
- Ubuntu 22.04 / Debian 12 (or any distro with Docker support)
- A domain name pointed at the server's IP
- Docker and Docker Compose installed

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

# Prisma
DATABASE_URL=postgresql://portfolio:<password>@postgres:5432/portfolio

# Backend
PORT=3000
JWT_SECRET=<64-char-random-string>
ADMIN_PASSWORD=<your-admin-password>

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

Generate a strong JWT secret:
```bash
openssl rand -hex 32
```

### 3. Build and start

```bash
docker compose up -d --build
```

This will:
1. Start PostgreSQL and wait until healthy
2. Start the backend, run migrations, seed the database, start Express
3. Run the frontend builder (fetches content from DB, builds Vite app, copies to volume)
4. Start nginx serving on port 80

Check status:
```bash
docker compose ps
docker compose logs -f
```

### 4. Seed initial content

The backend entrypoint runs `seed.ts` automatically on first start. It creates the admin credential using `ADMIN_PASSWORD` from `.env`. Log in to `https://yourdomain.com/admin` and fill in your bio, projects, and experience.

After saving content in the admin panel, trigger a frontend rebuild to publish it:

```bash
docker compose up frontend-builder --build
```

## HTTPS with nginx + Let's Encrypt

The included `nginx.conf` serves HTTP on port 80. To add HTTPS:

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### 2. Obtain a certificate

Stop nginx temporarily (or use the standalone mode):

```bash
docker compose down nginx
sudo certbot certonly --standalone -d yourdomain.com
docker compose up -d nginx
```

### 3. Update nginx config

Replace the nginx service in `docker-compose.yml` with a bind mount to `/etc/letsencrypt` and update `nginx/nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... rest of config unchanged ...
}
```

Add the cert volume to the nginx service in `docker-compose.yml`:
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
  - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - frontend_dist:/usr/share/nginx/html:ro
  - uploads:/uploads:ro
```

### 4. Auto-renew

```bash
sudo crontab -e
# Add:
0 3 * * * certbot renew --quiet && docker compose -f /path/to/3d-portfolio/docker-compose.yml restart nginx
```

## Updating the application

### Code update (new features/fixes)

```bash
git pull
docker compose up -d --build
```

### Content-only update (bio, projects changed via admin panel)

```bash
docker compose up frontend-builder --build
docker compose restart nginx
```

### Database migration only

If a new release includes schema changes, migrations run automatically when the backend container starts.

## Backups

### Database backup

```bash
docker compose exec postgres pg_dump -U portfolio portfolio > backup-$(date +%Y%m%d).sql
```

### Database restore

```bash
docker compose exec -T postgres psql -U portfolio portfolio < backup-20250101.sql
```

### Uploads backup

```bash
docker run --rm -v 3d-portfolio_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /data .
```

## Monitoring

### Check service health

```bash
docker compose ps
curl http://localhost/api/health
```

### View logs

```bash
docker compose logs -f backend     # backend errors
docker compose logs -f nginx        # request logs
```

### Resource usage

```bash
docker stats
```

## Common production issues

### Frontend shows stale content after admin update
Content is baked at build time. Run `docker compose up frontend-builder --build` to rebuild with the latest DB content.

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
docker compose logs backend   # check for migration errors or bad env vars
```

Most common causes: `DATABASE_URL` wrong, `JWT_SECRET` missing, or PostgreSQL not yet ready (increase `start_period` in the backend healthcheck if needed).
