FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat vips-dev python3 make g++ && \
    corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

# Workspace root — lockfile lives here
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Strapi package manifest
COPY strapi/package.json ./strapi/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter portfolio-strapi

WORKDIR /app/strapi

COPY strapi/tsconfig.json ./
COPY strapi/config ./config/
COPY strapi/src ./src/
COPY strapi/public ./public/
COPY strapi/database ./database/

ENV NODE_ENV=production
RUN pnpm build

# ---

FROM node:22-alpine AS runner

RUN apk add --no-cache vips && \
    corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY strapi/package.json ./strapi/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter portfolio-strapi --prod

WORKDIR /app/strapi

# strapi start loads config/ as plain JS from cwd — use the compiled output,
# not the TS source (which isn't executable at runtime).
COPY --from=builder /app/strapi/dist/config ./config/
COPY --from=builder /app/strapi/dist/src ./src/
COPY --from=builder /app/strapi/dist/build ./build/
COPY strapi/public ./public/
COPY strapi/database ./database/

RUN chown -R node:node /app

USER node

ENV NODE_ENV=production

EXPOSE 1337

CMD ["pnpm", "start"]
