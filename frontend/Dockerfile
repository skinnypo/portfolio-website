FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

# Workspace root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Frontend source
COPY frontend/package.json ./frontend/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter portfolio-frontend

WORKDIR /app/frontend

# Copy frontend source
COPY frontend/ .

RUN chmod +x entrypoint.sh

# /dist is populated at container runtime by entrypoint.sh
VOLUME ["/dist"]

ENTRYPOINT ["./entrypoint.sh"]
