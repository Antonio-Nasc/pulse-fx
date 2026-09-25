FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable \
  && corepack prepare pnpm@10.24.0 --activate

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

FROM base AS production-dependencies

RUN pnpm install --prod --frozen-lockfile

FROM base AS build

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/contracts packages/contracts

RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
  pnpm --filter @pulse-fx/api build

FROM node:22-alpine AS runner

ENV NODE_ENV="production"
ENV API_HOST="0.0.0.0"
ENV API_PORT="3333"

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

COPY --from=production-dependencies \
  /workspace/node_modules \
  /workspace/node_modules

COPY --from=production-dependencies \
  /workspace/apps/api/node_modules \
  /workspace/apps/api/node_modules

COPY --from=build \
  /workspace/apps/api/dist \
  /workspace/apps/api/dist

USER node

EXPOSE 3333

CMD ["node", "apps/api/dist/server.js"]
