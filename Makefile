.DEFAULT_GOAL := help
.PHONY: help install dev dev-backend dev-frontend build up up-build down restart logs \
        db-migrate db-seed db-studio db-reset lint clean rebuild-content \
        image-build image-push deploy

TAG := $(shell git describe --tags --abbrev=0)
REGISTRY := skinnypo

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
	@echo "  $(CYAN)Deploy$(RESET)"
	@echo "    image-build    Build backend + frontend images tagged with git SHA"
	@echo "    image-push     Build and push images to Docker Hub"
	@echo "    deploy         Build, push, and deploy to production server"
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
image-build:
	docker buildx build --platform linux/amd64 -t $(REGISTRY)/3d-portfolio-backend:$(TAG) -f backend/Dockerfile . --load
	docker buildx build --platform linux/amd64 -t $(REGISTRY)/3d-portfolio-frontend-builder:$(TAG) -f frontend/Dockerfile . --load

image-push: image-build
	docker push $(REGISTRY)/3d-portfolio-backend:$(TAG)
	docker push $(REGISTRY)/3d-portfolio-frontend-builder:$(TAG)
	@echo "IMAGE_TAG=$(TAG)"

deploy: image-push
	ssh deploy@smallstreetstory.com "cd 3d-portfolio && sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=$(TAG)/' .env && docker compose pull && docker compose up -d"

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
