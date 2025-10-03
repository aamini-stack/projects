# ==============================================================================
# pnpm: 
# https://pnpm.io/docker#example-2-build-multiple-docker-images-in-a-monorepo
# ==============================================================================
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=app1 --prod /prod/app1
RUN pnpm deploy --filter=app2 --prod /prod/app2

FROM base AS app1
COPY --from=build /prod/app1 /prod/app1
WORKDIR /prod/app1
EXPOSE 8000
CMD [ "pnpm", "start" ]

FROM base AS app2
COPY --from=build /prod/app2 /prod/app2
WORKDIR /prod/app2
EXPOSE 8001
CMD [ "pnpm", "start" ]

# ==============================================================================
# Astro: https://docs.astro.build/en/recipes/docker/
# ==============================================================================
FROM node:lts AS base
WORKDIR /app

# By copying only the package.json and package-lock.json here, we ensure that the following `-deps` steps are independent of the source code.
# Therefore, the `-deps` steps will be skipped if only the source code changes.
COPY package.json package-lock.json ./

FROM base AS prod-deps
RUN npm install --omit=dev

FROM base AS build-deps
RUN npm install

FROM build-deps AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD node ./dist/server/entry.mjs

# ==============================================================================
# Turborepo: https://turborepo.com/docs/guides/tools/docker
# ==============================================================================
FROM node:18-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
# Replace <your-major-version> with the major version installed in your repository. For example:
# RUN yarn global add turbo@^2
RUN yarn global add turbo@^<your-major-version>
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "web" is the name entered in the project's package.json: { name: "web" }
RUN turbo prune web --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN yarn install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
RUN yarn turbo run build

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

CMD node apps/web/server.js

# https://depot.dev/docs/container-builds/how-to-guides/optimal-dockerfiles/node-pnpm-dockerfile
