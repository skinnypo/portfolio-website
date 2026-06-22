FROM node:20-alpine
RUN npm install -g pnpm

WORKDIR /app

# Workspace root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Frontend source
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile --filter portfolio-frontend

WORKDIR /app/frontend

# Copy frontend source
COPY frontend/ .

RUN chmod +x entrypoint.sh

# /dist is populated at container runtime by entrypoint.sh
VOLUME ["/dist"]

ENTRYPOINT ["./entrypoint.sh"]
