# Backend Dockerfile - Optimized multi-stage build
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies for sharp (image processing) - required for Alpine
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

WORKDIR /app

# ============================================
# Dependencies stage - install all dependencies
# ============================================
FROM base AS deps

# Copy root package files for workspace resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace package.json files
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Builder stage - compile TypeScript
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source code
COPY shared ./shared
COPY backend ./backend

# Build shared package first (backend depends on it)
WORKDIR /app/shared
RUN pnpm build

# Build backend
WORKDIR /app/backend
RUN pnpm build

# ============================================
# Production stage - runtime only
# ============================================
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled code from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

# Copy fonts directory (required for barcode generation)
COPY backend/fonts ./backend/fonts

WORKDIR /app/backend

# Expose backend port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/barcode/generate', (r) => {process.exit(r.statusCode === 405 ? 0 : 1)})"

# Start the backend server
CMD ["node", "dist/server.js"]
