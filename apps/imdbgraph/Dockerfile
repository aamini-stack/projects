FROM node:22-alpine AS runtime

FROM runtime AS pruned
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm
WORKDIR /app
COPY . .
RUN pnpm i -g turbo@^2
RUN turbo prune imdbgraph --docker

FROM pruned AS build
WORKDIR /app
COPY --from=pruned /app/out/json/pnpm-lock.yaml .
RUN  --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch
COPY --from=pruned /app/out/json ./
RUN  --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i
COPY --from=pruned /app/out/full ./
RUN pnpm build --filter=imdbgraph 

FROM runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/imdbgraph/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
