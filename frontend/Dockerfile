# Frontend Dockerfile - Optimized Next.js 16 multi-stage build
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ============================================
# Dependencies stage - install all dependencies
# ============================================
FROM base AS deps

# Copy root package files for workspace resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace package.json files
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Builder stage - build Next.js application
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Copy source code
COPY shared ./shared
COPY frontend ./frontend

# Build shared package first (frontend depends on it)
WORKDIR /app/shared
RUN pnpm build

# Build frontend
WORKDIR /app/frontend

# Set Next.js environment variables for production build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN pnpm build

# ============================================
# Production stage - runtime only
# ============================================
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled shared package
COPY --from=builder /app/shared/dist ./shared/dist

# Copy Next.js build output and necessary files
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/next.config.ts ./frontend/next.config.ts
COPY --from=builder /app/frontend/package.json ./frontend/package.json

# Copy additional Next.js required files if they exist
COPY --from=builder /app/frontend/.next/standalone ./frontend/.next/standalone 2>/dev/null || true

WORKDIR /app/frontend

# Expose frontend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js production server
CMD ["pnpm", "start"]
