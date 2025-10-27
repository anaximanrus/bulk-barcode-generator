# Docker Deployment Guide

Comprehensive guide for deploying the Barcode Generator application using Docker.

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## Architecture

### Multi-Container Architecture (Recommended)

```
┌─────────────────────────────────────────────┐
│              Docker Host                     │
│                                              │
│  ┌────────────────┐    ┌─────────────────┐ │
│  │   Frontend     │    │    Backend      │ │
│  │   (Next.js)    │───▶│   (Express)     │ │
│  │   Port: 3000   │    │   Port: 4000    │ │
│  └────────────────┘    └─────────────────┘ │
│                                              │
│  Network: barcode-network                    │
└─────────────────────────────────────────────┘
        │                        │
        ▼                        ▼
    Browser                  API Calls
   (Port 3000)             (Port 4000)
```

**Services:**
- **Frontend**: Next.js 16 application serving the UI
- **Backend**: Express.js API handling barcode generation
- **Network**: Bridge network for inter-service communication
- **Health Checks**: Automated container health monitoring

### Single-Container Architecture (Simple Deployment)

```
┌─────────────────────────────────────────┐
│          Docker Container               │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │         PM2 Process Manager      │  │
│  │                                  │  │
│  │  ┌──────────┐   ┌────────────┐  │  │
│  │  │ Frontend │   │  Backend   │  │  │
│  │  │  :3000   │   │   :4000    │  │  │
│  │  └──────────┘   └────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
         │              │
         ▼              ▼
    Port 3000      Port 4000
```

**Features:**
- Both services in one container
- PM2 for process management
- Combined health checks
- Simpler deployment

## Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher (for multi-container setup)
- **System Requirements**:
  - RAM: Minimum 2GB, Recommended 4GB
  - Disk: ~1GB for images
  - CPU: 2 cores recommended

**Check your Docker installation:**
```bash
docker --version
docker-compose --version
```

## Quick Start

### Option 1: Multi-Container Setup (Recommended)

```bash
# 1. Navigate to project root
cd /path/to/barcode-generator

# 2. Build and start all services
docker-compose up -d

# 3. Check logs
docker-compose logs -f

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

### Option 2: Single Container Setup

```bash
# 1. Build the combined image
docker build -f Dockerfile.all -t barcode-generator:latest .

# 2. Run the container
docker run -d \
  --name barcode-app \
  -p 3000:3000 \
  -p 4000:4000 \
  --restart unless-stopped \
  barcode-generator:latest

# 3. Check logs
docker logs -f barcode-app

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

## Deployment Options

### Multi-Container Commands

```bash
# Build images without starting
docker-compose build

# Start services in foreground (with logs)
docker-compose up

# Start services in background
docker-compose up -d

# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f [service-name]

# Check service status
docker-compose ps

# Execute command in running container
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Single Container Commands

```bash
# Build image
docker build -f Dockerfile.all -t barcode-generator:latest .

# Run container
docker run -d \
  --name barcode-app \
  -p 3000:3000 \
  -p 4000:4000 \
  --restart unless-stopped \
  barcode-generator:latest

# Stop container
docker stop barcode-app

# Start container
docker start barcode-app

# Remove container
docker rm -f barcode-app

# View logs
docker logs -f barcode-app

# Execute shell in container
docker exec -it barcode-app sh

# Rebuild and run
docker rm -f barcode-app
docker build -f Dockerfile.all -t barcode-generator:latest .
docker run -d --name barcode-app -p 3000:3000 -p 4000:4000 barcode-generator:latest
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend Configuration
NODE_ENV=production
PORT=4000

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Using with docker-compose:**
```yaml
# Uncomment in docker-compose.yml
environment:
  - NODE_ENV=${NODE_ENV:-production}
  - PORT=${PORT:-4000}
```

**Using with single container:**
```bash
docker run -d \
  --name barcode-app \
  -p 3000:3000 -p 4000:4000 \
  --env-file .env \
  barcode-generator:latest
```

### Port Configuration

**Change default ports:**

**docker-compose.yml:**
```yaml
services:
  frontend:
    ports:
      - "8080:3000"  # Host:Container
  backend:
    ports:
      - "8000:4000"
```

**Single container:**
```bash
docker run -d \
  -p 8080:3000 \
  -p 8000:4000 \
  barcode-generator:latest
```

### Volume Mounts

**Mount fonts directory (live updates without rebuild):**

```yaml
# docker-compose.yml
services:
  backend:
    volumes:
      - ./backend/fonts:/app/backend/fonts:ro
```

**Single container:**
```bash
docker run -d \
  -v $(pwd)/backend/fonts:/app/backend/fonts:ro \
  -p 3000:3000 -p 4000:4000 \
  barcode-generator:latest
```

## Health Checks

Both deployment options include automated health checks.

### Check Health Status

**Multi-container:**
```bash
# Check all services
docker-compose ps

# Expected output:
# NAME                STATUS              PORTS
# barcode-backend    Up (healthy)        0.0.0.0:4000->4000/tcp
# barcode-frontend   Up (healthy)        0.0.0.0:3000->3000/tcp
```

**Single container:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"

# Expected output:
# NAMES            STATUS
# barcode-app      Up 2 minutes (healthy)
```

### Manual Health Check

**Backend:**
```bash
curl http://localhost:4000/api/barcode/generate
# Expected: 405 Method Not Allowed (GET not allowed, POST required)
```

**Frontend:**
```bash
curl http://localhost:3000/
# Expected: 200 OK (HTML response)
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
# Multi-container
docker-compose logs backend
docker-compose logs frontend

# Single container
docker logs barcode-app
```

**Common issues:**
1. **Port already in use:**
   ```bash
   # Find process using port
   lsof -i :3000
   lsof -i :4000

   # Kill process or change port mapping
   ```

2. **Out of memory:**
   ```bash
   # Increase Docker memory limit in Docker Desktop settings
   # Recommended: 4GB minimum
   ```

3. **Build fails:**
   ```bash
   # Clear Docker cache
   docker system prune -a

   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Service Unhealthy

**Backend unhealthy:**
```bash
# Check backend logs
docker-compose logs backend

# Common causes:
# - Port 4000 not available
# - Missing fonts directory
# - TypeScript compilation errors
```

**Frontend unhealthy:**
```bash
# Check frontend logs
docker-compose logs frontend

# Common causes:
# - Port 3000 not available
# - Backend not accessible
# - Next.js build errors
```

### Fonts Not Loading

**Verify fonts directory:**
```bash
# Multi-container
docker-compose exec backend ls -la /app/backend/fonts

# Single container
docker exec barcode-app ls -la /app/backend/fonts

# Expected output:
# -rw-r--r-- CourierPrime-Regular.ttf
# -rw-r--r-- Lato-Regular.ttf
# -rw-r--r-- Montserrat-Regular.ttf
# -rw-r--r-- OpenSans-Regular.ttf
# -rw-r--r-- Roboto-Regular.ttf
```

### Performance Issues

**Monitor resource usage:**
```bash
# Real-time stats
docker stats

# Container resource limits
docker run -d \
  --cpus="2" \
  --memory="2g" \
  -p 3000:3000 -p 4000:4000 \
  barcode-generator:latest
```

## Production Deployment

### Optimization Checklist

- [ ] **Multi-stage builds enabled** (default in Dockerfiles)
- [ ] **Health checks configured** (default in docker-compose.yml)
- [ ] **Resource limits set** (CPU/memory)
- [ ] **Restart policy configured** (`restart: unless-stopped`)
- [ ] **Logs centralized** (consider using logging driver)
- [ ] **Security hardening** (non-root user, minimal base image)
- [ ] **Environment variables secured** (use secrets management)
- [ ] **Monitoring enabled** (Prometheus, Grafana, etc.)

### Security Best Practices

1. **Use secrets for sensitive data:**
   ```bash
   # Docker Swarm secrets
   docker secret create api_key ./api_key.txt
   ```

2. **Run as non-root user** (already implemented in Dockerfiles)

3. **Scan images for vulnerabilities:**
   ```bash
   docker scan barcode-generator:latest
   ```

4. **Keep base images updated:**
   ```bash
   docker pull node:20-alpine
   docker-compose build --pull
   ```

### Production docker-compose.yml Example

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    environment:
      - NODE_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - barcode-network

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
    depends_on:
      - backend
    networks:
      - barcode-network

networks:
  barcode-network:
    driver: bridge
```

### Kubernetes Deployment

For Kubernetes deployments, convert docker-compose.yml:

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.31.2/kompose-linux-amd64 -o kompose

# Convert docker-compose to Kubernetes manifests
kompose convert -f docker-compose.yml
```

## Image Size Optimization

**Current image sizes:**
- Backend: ~250MB (multi-stage optimized)
- Frontend: ~350MB (multi-stage optimized)
- Combined: ~400MB (shared layers)

**Further optimization:**
```dockerfile
# Use distroless images for even smaller footprint
FROM gcr.io/distroless/nodejs20-debian12
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify health: `docker-compose ps`
3. Review this guide's troubleshooting section
4. Check main README.md for application-specific issues

## Summary of Files

```
barcode-generator/
├── .dockerignore              # Files to exclude from Docker context
├── docker-compose.yml         # Multi-container orchestration
├── Dockerfile.all             # Single-container deployment
├── backend/
│   └── Dockerfile            # Backend-specific build
├── frontend/
│   └── Dockerfile            # Frontend-specific build
└── README-DOCKER.md          # This file
```

---

**Quick Reference Card:**

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start multi-container |
| `docker-compose down` | Stop multi-container |
| `docker-compose logs -f` | View logs |
| `docker-compose ps` | Check status |
| `docker build -f Dockerfile.all -t barcode-generator .` | Build single container |
| `docker run -d -p 3000:3000 -p 4000:4000 barcode-generator` | Run single container |
| `docker logs -f barcode-app` | View single container logs |
| `docker system prune -a` | Clean up Docker |

---

**Ports:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- API Endpoint: `http://localhost:4000/api/barcode/generate`
