# LendSmart Root Dockerfile
# Builds the backend Node.js service (main API)
# For Python ML services, see ml_services/credit_risk/Dockerfile

FROM node:18-alpine AS base

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY backend/package*.json ./

# ─── Development ──────────────────────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY backend/ .
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000 9229
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["dumb-init", "npm", "run", "dev"]

# ─── Production Dependencies ───────────────────────────────────────────────────
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs backend/src ./src
COPY --chown=nodejs:nodejs backend/package*.json ./

RUN mkdir -p logs uploads temp && chown -R nodejs:nodejs logs uploads temp

ENV NODE_ENV=production
ENV PORT=3000
USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]

LABEL maintainer="LendSmart Team <dev@lendsmart.com>"
LABEL version="2.0.0"
LABEL description="LendSmart - Enterprise Lending Platform Backend"
