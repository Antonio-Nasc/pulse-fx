FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable \
  && corepack prepare pnpm@10.24.0 --activate

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/contracts packages/contracts

RUN pnpm --filter @pulse-fx/web build

FROM nginx:1.28-alpine AS runner

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80