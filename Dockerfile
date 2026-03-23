# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Builder
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Development (with tsx hot-reload)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app

ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN addgroup -S govstack && adduser -S govstack -G govstack
RUN mkdir -p uploads && chown govstack:govstack uploads

USER govstack

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["npx", "tsx", "watch", "src/index.ts"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: Production runner
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Only production deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN addgroup -S govstack && adduser -S govstack -G govstack
RUN mkdir -p uploads && chown govstack:govstack uploads

USER govstack

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
