FROM node:20-alpine AS builder

RUN apk add --no-cache openssl
RUN npm install -g pnpm

WORKDIR /app

# Workspace root — lockfile lives here
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Backend package manifest + prisma schema (needed before install)
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma/

RUN pnpm install --frozen-lockfile --filter portfolio-backend

WORKDIR /app/backend

RUN pnpm db:generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/

RUN pnpm build

# ---

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl postgresql-client
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile --filter portfolio-backend --prod

WORKDIR /app/backend

COPY backend/prisma ./prisma/

RUN pnpm db:generate

COPY --from=builder /app/backend/dist ./dist/
COPY backend/entrypoint.sh ./

RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
