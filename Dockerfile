# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm-slim AS base
LABEL org.opencontainers.image.source="https://github.com/aamini-stack/projects"
ENV TURBO_TELEMETRY_DISABLED=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack install -g pnpm@10.29.3

FROM base AS pruner
ARG APP_NAME
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm dlx turbo@^2 prune ${APP_NAME} --docker

FROM base AS installer
ARG APP_NAME
ENV CI=true
WORKDIR /app
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /repo/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm fetch --frozen-lockfile
COPY --from=pruner /repo/out/json/ ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --frozen-lockfile --offline
COPY --from=pruner /repo/out/full/ ./

RUN pnpm turbo run build --filter=${APP_NAME}

FROM node:${NODE_VERSION}-bookworm-slim AS production
ARG APP_NAME
ARG PORT=3000
ENV NODE_ENV=production
ENV PORT=${PORT}
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
	&& useradd --system --uid 1001 --gid nodejs app
COPY --from=installer --chown=app:nodejs /app/apps/${APP_NAME}/.output ./.output
USER app
EXPOSE ${PORT}
CMD ["node", ".output/server/index.mjs"]

FROM mcr.microsoft.com/playwright:v1.58.2-noble AS e2e
ARG APP_NAME
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack install -g pnpm@10.29.3
WORKDIR /app
COPY --from=installer /app /app
COPY apps/${APP_NAME}/playwright.config.ts /app/apps/${APP_NAME}/playwright.config.ts
COPY apps/${APP_NAME}/e2e /app/apps/${APP_NAME}/e2e
WORKDIR /app/apps/${APP_NAME}
ENTRYPOINT ["pnpm", "playwright", "test", "--config=playwright.config.ts"]
