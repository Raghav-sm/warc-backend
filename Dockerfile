FROM node:22.12.0-slim AS base
WORKDIR /opt/server/png-hrms-backend

FROM base AS deps
ENV DATABASE_URL="postgresql://docker_build:docker_build@127.0.0.1:5432/docker_build?schema=public"
COPY package.json yarn.lock prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN yarn install --frozen-lockfile

FROM deps AS build
COPY src ./src
RUN yarn build

# Production node_modules only
# (do not use npm prune on yarn layouts — it can drop deps listed in both dev + prod, e.g. argon2)
FROM base AS prod-deps
ENV DATABASE_URL="postgresql://docker_build:docker_build@127.0.0.1:5432/docker_build?schema=public"
COPY package.json yarn.lock prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN yarn install --frozen-lockfile --production

FROM node:22.12.0-slim AS runner
WORKDIR /opt/server/png-hrms-backend

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=768"

COPY package.json prisma.config.ts ./
COPY --from=prod-deps /opt/server/png-hrms-backend/node_modules ./node_modules
COPY --from=build /opt/server/png-hrms-backend/build ./build
COPY --from=deps /opt/server/png-hrms-backend/prisma ./prisma

RUN chown -R node:node /opt/server/png-hrms-backend

EXPOSE 8081

CMD ["node", "build/src/server.js"]
