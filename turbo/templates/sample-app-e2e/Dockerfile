# Template:
# https://github.com/vercel/turborepo/blob/main/examples/with-docker/apps/api/Dockerfile

FROM mcr.microsoft.com/playwright:v1.54.0-jammy AS base

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install Turbo CLI and "prune" sources. 
# (https://turborepo.com/docs/guides/tools/docker)
FROM base AS builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i -g turbo
WORKDIR /app
COPY . . 
RUN turbo prune @aamini/{{ appName }} --docker

# Run install and run Playwright
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/out/full/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i
CMD ["pnpm", "exec", "turbo", "run", "e2e", "--", "--update-snapshots"]
