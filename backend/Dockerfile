FROM node:22-alpine AS builder

RUN apk add --no-cache openssl && \
    corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

# Workspace root — lockfile lives here
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Backend package manifest + prisma schema (needed before install)
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter portfolio-backend

WORKDIR /app/backend

RUN pnpm db:generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/

RUN pnpm build

# ---

FROM node:22-alpine AS runner

RUN apk add --no-cache openssl postgresql-client && \
    corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter portfolio-backend --prod

WORKDIR /app/backend

COPY backend/prisma ./prisma/

RUN pnpm db:generate

COPY --from=builder /app/backend/dist ./dist/
COPY backend/entrypoint.sh ./

RUN chmod +x entrypoint.sh && \
    chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
