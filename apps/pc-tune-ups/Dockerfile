FROM node:lts AS runtime

FROM runtime AS pruned
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm
WORKDIR /app
COPY . .
RUN pnpm i -g turbo@^2
RUN turbo prune pc-tune-ups --docker

FROM pruned AS build
WORKDIR /app
COPY --from=pruned /app/out/json/pnpm-lock.yaml .
RUN  --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch
COPY --from=pruned /app/out/json ./
RUN  --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i
COPY --from=pruned /app/out/full ./
RUN pnpm build --filter=pc-tune-ups 

FROM runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/pc-tune-ups/dist ./dist
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD [ "node", "./dist/server/entry.mjs" ]
