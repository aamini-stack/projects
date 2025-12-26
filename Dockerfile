ARG NODE_VERSION=22

##############################################################################
# Stage: runtime-base - Base runtime image for production
##############################################################################
FROM node:${NODE_VERSION}-alpine AS runtime-base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm

##############################################################################
# Stage: e2e-base - Base image for E2E tests (Playwright)
##############################################################################
FROM mcr.microsoft.com/playwright:v1.57.0-noble AS e2e-base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm

##############################################################################
# Stage: pruned - Turbo pruning for production builds
##############################################################################
FROM runtime-base AS pruned

ARG APP_NAME

# Validate APP_NAME is provided
RUN if [ -z "$APP_NAME" ]; then \
      printf "\n========================================\n"; \
      printf "ERROR: APP_NAME build argument is required\n"; \
      printf "========================================\n\n"; \
      exit 1; \
    fi

WORKDIR /app

# Copy entire monorepo for pruning
COPY . .

# Install turbo globally and prune workspace to only include dependencies for target app
RUN pnpm i -g turbo@^2
RUN turbo prune ${APP_NAME} --docker

##############################################################################
# Stage: build - Production build
##############################################################################
FROM runtime-base AS build

ARG APP_NAME

WORKDIR /app

# Copy lockfile and fetch dependencies with cache mount
COPY --from=pruned /app/out/json/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

# Copy package.json files and install all dependencies
COPY --from=pruned /app/out/json/ ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

# Copy source code and build the app
COPY --from=pruned /app/out/full/ ./
RUN pnpm build --filter=${APP_NAME}

##############################################################################
# Stage: production - Final production runtime (DEFAULT TARGET)
##############################################################################
FROM runtime-base AS production

ARG APP_NAME
ARG PORT=3000

WORKDIR /app

# Copy node_modules from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy built artifacts (.output directory from Nitro/TanStack Start)
COPY --from=build /app/apps/${APP_NAME}/.output ./.output

# Set environment variables
ENV PORT=${PORT}
ENV NODE_ENV=production

# Expose the port
EXPOSE ${PORT}

# Start the server
CMD ["node", ".output/server/index.mjs"]

##############################################################################
# Stage: e2e-deps - Install dependencies for E2E tests
##############################################################################
FROM e2e-base AS e2e-deps

ARG APP_NAME

# Validate APP_NAME is provided
RUN if [ -z "$APP_NAME" ]; then \
      printf "\n========================================\n"; \
      printf "ERROR: APP_NAME build argument is required\n"; \
      printf "========================================\n\n"; \
      exit 1; \
    fi

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ./packages/ ./packages/
COPY ./apps/${APP_NAME}/package.json ./apps/${APP_NAME}/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

##############################################################################
# Stage: e2e-builder - Build app for E2E tests
##############################################################################
FROM e2e-deps AS e2e-builder

ARG APP_NAME
ARG CI=false

WORKDIR /app/apps/${APP_NAME}
COPY ./apps/${APP_NAME}/ .
RUN if [ "$CI" != "true" ]; then pnpm build; fi

##############################################################################
# Stage: e2e-test - Run E2E tests (E2E TARGET)
##############################################################################
FROM e2e-deps AS e2e-test

ARG APP_NAME
ARG CI=false

WORKDIR /app/apps/${APP_NAME}
COPY ./apps/${APP_NAME}/ .

# Only copy build artifacts if not in CI (when CI=true, tests will use BASE_URL)
RUN --mount=type=bind,from=e2e-builder,source=/app/apps/${APP_NAME},target=/build \
    if [ "$CI" != "true" ]; then \
      cp -r /build/.output .output 2>/dev/null || true; \
      cp -r /build/dist dist 2>/dev/null || true; \
    fi

ENTRYPOINT ["pnpm", "playwright", "test"]
