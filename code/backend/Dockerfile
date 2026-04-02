# Multi-stage Dockerfile for LendSmart Backend
# Optimized for production deployment with security and performance

# ─── Base Stage ──────────────────────────────────────────────────────────────
FROM node:18-alpine AS base

WORKDIR /app

# Install system dependencies for native modules
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
    dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files first (for layer caching)
COPY package*.json ./

# ─── Development Stage ────────────────────────────────────────────────────────
FROM base AS development

ENV NODE_ENV=development

# Install all dependencies (including dev)
RUN npm ci --include=dev

COPY . .

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000 9229

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["dumb-init", "npm", "run", "dev"]

# ─── Production Dependencies Stage ───────────────────────────────────────────
FROM base AS deps

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:18-alpine AS production

WORKDIR /app

# Install minimal runtime deps
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production node_modules from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs package*.json ./

# Create writable directories
RUN mkdir -p logs uploads temp && \
    chown -R nodejs:nodejs logs uploads temp

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
LABEL description="LendSmart Backend API - Production-ready financial lending platform"
LABEL org.opencontainers.image.title="LendSmart Backend"
LABEL org.opencontainers.image.version="2.0.0"
LABEL org.opencontainers.image.vendor="LendSmart"
