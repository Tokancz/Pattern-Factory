# syntax=docker/dockerfile:1

# ── Build stage: compile TypeScript → dist/ ──────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Install all deps (incl. dev) for the tsc build, using the lockfile.
COPY package.json package-lock.json ./
RUN npm ci

# Compile. tsconfig outputs to ./dist with NodeNext + .js imports.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runtime stage: production deps + compiled output only ────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only production dependencies in the final image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Run as the unprivileged user that the node image already provides.
USER node

# Documentation only — the app binds to $PORT (Northflank injects it),
# falling back to 3001. See src/config.ts.
EXPOSE 3001

CMD ["node", "dist/server.js"]
