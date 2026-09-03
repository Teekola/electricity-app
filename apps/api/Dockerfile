# Build context is the repo root: turbo prune needs the whole workspace.
FROM node:24.19.0-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# --docker splits the output into out/json (package.json files) and out/full (sources),
# so the install layers below stay cached until a dependency changes.
FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@2.10.12 prune @repo/api --docker

# --ignore-scripts: the only lifecycle script here is the root prepare running husky,
# which has no .git to install into and is absent once devDependencies are skipped.
FROM base AS builder
WORKDIR /repo
COPY --from=pruner /repo/.npmrc ./
COPY --from=pruner /repo/out/json/ ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner /repo/out/full/ ./
RUN pnpm turbo run build --filter=@repo/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=pruner /repo/.npmrc ./
COPY --from=pruner /repo/out/json/ ./
# Installed fresh rather than copied from the builder, so devDependencies never reach the
# image. --filter excludes the root ones; the store goes in the same layer or it is
# baked in forever, and node_modules hardlinks into it so the files survive.
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter=@repo/api \
  && rm -rf "$PNPM_HOME"
COPY --from=builder /repo/apps/api/dist ./apps/api/dist

USER node
EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]
