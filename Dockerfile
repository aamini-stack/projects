# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm-slim AS base
LABEL org.opencontainers.image.source="https://github.com/aamini-stack/projects"
ENV TURBO_TELEMETRY_DISABLED=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PNPM_HOME=/tmp/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack install -g pnpm@10.29.3

FROM base AS pruner
ARG APP_NAME
WORKDIR /repo
COPY . .
RUN --mount=type=cache,id=s/a3fa7482-5e23-4db6-b445-b88167cc20e4-/pnpm/store,target=/pnpm/store \
	pnpm dlx turbo@^2 prune ${APP_NAME} --docker

FROM base AS installer
ARG APP_NAME
ENV CI=true
WORKDIR /app
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /repo/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=s/a3fa7482-5e23-4db6-b445-b88167cc20e4-/pnpm/store,target=/pnpm/store \
	pnpm fetch --frozen-lockfile
COPY --from=pruner /repo/out/json/ ./
RUN --mount=type=cache,id=s/a3fa7482-5e23-4db6-b445-b88167cc20e4-/pnpm/store,target=/pnpm/store \
	pnpm install --frozen-lockfile --offline
COPY --from=pruner /repo/out/full/ ./

RUN pnpm turbo run build --filter=${APP_NAME}

FROM base
ARG APP_NAME
ARG PORT=3000
ENV NODE_ENV=production
ENV PORT=${PORT}
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
	&& useradd --system --uid 1001 --gid nodejs app
RUN mkdir -p /home/app/.cache/node/corepack \
	&& chown -R app:nodejs /home/app/.cache

# Install varlock globally for runtime env loading
RUN pnpm add -g varlock

# Copy the built app and env schema
COPY --from=installer --chown=app:nodejs /app/apps/${APP_NAME}/.output ./.output
COPY --from=installer --chown=app:nodejs /app/apps/${APP_NAME}/.env.schema ./.env.schema

# Ensure app user can write to /app (needed for varlock env.d.ts generation)
RUN chown -R app:nodejs /app

USER app
EXPOSE ${PORT}
CMD ["sh", "-c", "varlock run -- node .output/server/index.mjs"]
