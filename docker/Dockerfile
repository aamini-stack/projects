# syntax=docker/dockerfile:1
# Dockerfile for TanStack Start apps in @aamini monorepo
#
# This Dockerfile dynamically builds any TanStack Start app using build arguments.
# TanStack Start uses Nitro for SSR, which outputs to .output/ directory.
#
# Required build arguments:
#   APP_NAME - Name of the app to build (e.g., imdbgraph)
#
# Optional build arguments:
#   NODE_VERSION - Node.js version (default: 22)
#   PORT - Port to expose (default: 3000)
#
# Usage:
#   docker build --build-arg APP_NAME=imdbgraph -f docker/Dockerfile.tanstack-start -t imdbgraph:latest .
#
# Or use the build script:
#   ./docker/build.sh imdbgraph

ARG NODE_VERSION=22

##############################################################################
# Stage 1: Base runtime image
##############################################################################
FROM node:${NODE_VERSION}-alpine AS runtime

##############################################################################
# Stage 2: Turbo pruning - optimize monorepo for single app
##############################################################################
FROM runtime AS pruned

ARG APP_NAME

# Validate APP_NAME is provided
RUN if [ -z "$APP_NAME" ]; then \
      printf "\n========================================\n"; \
      printf "ERROR: APP_NAME build argument is required\n"; \
      printf "========================================\n\n"; \
      printf "Usage: docker build --build-arg APP_NAME=<name> -f docker/Dockerfile.tanstack-start -t <tag> .\n\n"; \
      printf "Example: docker build --build-arg APP_NAME=imdbgraph -f docker/Dockerfile.tanstack-start -t imdbgraph:latest .\n\n"; \
      printf "Or use the build script: ./docker/build.sh <app-name>\n\n"; \
      exit 1; \
    fi

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable pnpm
WORKDIR /app

# Copy entire monorepo for pruning
COPY . .

# Install turbo globally and prune workspace to only include dependencies for target app
RUN pnpm i -g turbo@^2
RUN turbo prune ${APP_NAME} --docker

##############################################################################
# Stage 3: Install dependencies and build
##############################################################################
FROM runtime AS build

ARG APP_NAME

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable pnpm
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
# Stage 4: Production runtime
##############################################################################
FROM runtime

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
