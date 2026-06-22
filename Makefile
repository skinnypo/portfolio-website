.DEFAULT_GOAL := help
.PHONY: help install dev dev-backend dev-frontend build up up-build down restart logs \
        db-migrate db-seed db-studio db-reset lint clean rebuild-content

# ── Colors ──────────────────────────────────────────────────────────────────
CYAN  := \033[36m
RESET := \033[0m

# ── Help ────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  $(CYAN)3D Portfolio — available targets$(RESET)"
	@echo ""
	@echo "  $(CYAN)Development$(RESET)"
	@echo "    install        Install all workspace dependencies"
	@echo "    dev            Start backend + frontend in watch mode (two terminals)"
	@echo "    dev-backend    Start backend only (tsx watch)"
	@echo "    dev-frontend   Start frontend Vite dev server"
	@echo ""
	@echo "  $(CYAN)Docker$(RESET)"
	@echo "    up             docker compose up (detached)"
	@echo "    up-build       docker compose up --build (detached)"
	@echo "    build          Build all Docker images without starting"
	@echo "    down           Stop and remove containers"
	@echo "    restart        down + up-build"
	@echo "    rebuild-content  Re-fetch content from DB and rebuild frontend (after admin update)"
	@echo "    logs           Follow logs from all services"
	@echo "    logs-backend   Follow backend logs only"
	@echo "    logs-frontend  Follow frontend-builder logs only"
	@echo ""
	@echo "  $(CYAN)Database$(RESET)"
	@echo "    db-migrate     Run pending Prisma migrations (dev)"
	@echo "    db-seed        Seed the database"
	@echo "    db-studio      Open Prisma Studio in browser"
	@echo "    db-reset       Drop + recreate DB, run migrations, seed"
	@echo ""
	@echo "  $(CYAN)Quality$(RESET)"
	@echo "    lint           Run ESLint on frontend"
	@echo "    clean          Remove build artifacts"
	@echo ""

# ── Development ─────────────────────────────────────────────────────────────
install:
	pnpm install

dev: dev-backend dev-frontend

dev-backend:
	pnpm --filter portfolio-backend run dev

dev-frontend:
	pnpm --filter portfolio-frontend run dev

# ── Docker ──────────────────────────────────────────────────────────────────
up:
	docker compose up -d

up-build:
	docker compose up -d --build

build:
	docker compose build

down:
	docker compose down

restart: down up-build

rebuild-content:
	docker compose up -d --build frontend-builder && docker compose restart nginx

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend-builder

# ── Database ─────────────────────────────────────────────────────────────────
db-migrate:
	pnpm --filter portfolio-backend exec prisma migrate dev

db-seed:
	pnpm --filter portfolio-backend run db:seed

db-studio:
	pnpm --filter portfolio-backend exec prisma studio

db-reset:
	pnpm --filter portfolio-backend exec prisma migrate reset --force

# ── Quality ──────────────────────────────────────────────────────────────────
lint:
	pnpm --filter portfolio-frontend run lint

clean:
	rm -rf frontend/dist backend/dist frontend/src/data/content.json
