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
# Every workspace package the runtime needs must be named, or its symlink is left broken.
# The store is removed in this same layer or it stays in the image.
RUN pnpm install --frozen-lockfile --prod --ignore-scripts \
  --filter=@repo/api --filter=@repo/api-contract \
  && rm -rf "$PNPM_HOME"
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/packages/api-contract/dist ./packages/api-contract/dist

USER node
EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]
