FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ src/
COPY bin/ bin/
RUN npm run typecheck

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# events.jsonl vive su volume esterno: -v $(pwd)/.xpflow:/app/.xpflow
ENTRYPOINT ["node", "dist/bin/xpflow.js"]
