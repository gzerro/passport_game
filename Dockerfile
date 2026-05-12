# syntax=docker/dockerfile:1
# Сборка React (Vite); для запросов к API подставьте URL на этапе build, если не localhost.
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
RUN bun install --no-cache --frozen-lockfile
COPY . .

ARG VITE_PROVIDER_API_BASE_URL=http://localhost:3010
ENV VITE_PROVIDER_API_BASE_URL=${VITE_PROVIDER_API_BASE_URL}

RUN bun run build

# React (статика) — порт 3000; server/provider-adapter.mjs — порт 3001.
FROM node:22-alpine AS production
RUN npm install -g serve@14

RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server ./server

RUN chown -R app:app /app
USER app

ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3000 3001

# serve — SPA из dist; adapter слушает PLATFORM_* и API (отдельный процесс).
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:3000 & exec node server/provider-adapter.mjs"]
