# Multi-stage Dockerfile for LendSmart Backend
# Optimized for production deployment with security and performance

# Base stage with Node.js
FROM node:18-alpine AS base

# Set working directory
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

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000 9229

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start development server with nodemon
CMD ["dumb-init", "npm", "run", "dev"]

# Testing stage
FROM development AS testing

# Set test environment
ENV NODE_ENV=test

# Run tests
RUN npm run test

# Production dependencies stage
FROM base AS deps

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Production build stage
FROM base AS build

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build application (if there's a build step)
RUN npm run build 2>/dev/null || echo "No build script found"

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/src ./src
COPY --from=build --chown=nodejs:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p logs uploads temp && \
    chown -R nodejs:nodejs logs uploads temp

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Security: Don't run as root
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]

# Security scanning stage
FROM production AS security-scan

# Switch back to root for security tools
USER root

# Install security scanning tools
RUN apk add --no-cache \
    curl \
    wget \
    nmap \
    openssl

# Copy security scripts
COPY scripts/security-scan.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/security-scan.sh

# Run security scan
RUN /usr/local/bin/security-scan.sh

# Switch back to nodejs user
USER nodejs

# Minimal production stage for final deployment
FROM node:18-alpine AS minimal

# Install only essential packages
RUN apk add --no-cache dumb-init tini

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only necessary files from production stage
COPY --from=production --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=production --chown=nodejs:nodejs /app/src ./src
COPY --from=production --chown=nodejs:nodejs /app/package.json ./

# Create directories
RUN mkdir -p logs && chown nodejs:nodejs logs

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Security settings
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use tini for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start application
CMD ["node", "src/server.js"]

# Labels for metadata
LABEL maintainer="LendSmart Team <dev@lendsmart.com>"
LABEL version="1.0.0"
LABEL description="LendSmart Backend API - Production-ready financial lending platform"
LABEL org.opencontainers.image.title="LendSmart Backend"
LABEL org.opencontainers.image.description="Production-ready backend for LendSmart financial platform"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="LendSmart"
LABEL org.opencontainers.image.licenses="PROPRIETARY"
LABEL org.opencontainers.image.source="https://github.com/lendsmart/backend"
