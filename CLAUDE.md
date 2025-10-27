# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Barcode Generator** - Full-stack monorepo application for bulk barcode generation with hybrid client/server architecture.

**Tech Stack**: Next.js 16 + React 19 frontend, Express backend, TypeScript strict mode, pnpm workspaces

## Development Commands

### Monorepo Commands (from root)
```bash
pnpm dev          # Run frontend (port 3000) and backend (port 4000) concurrently
pnpm build        # Build shared → frontend → backend in order
pnpm type-check   # Type-check all packages
pnpm lint         # Lint all packages
```

### Frontend Commands
```bash
pnpm --filter frontend dev         # Next.js dev server on http://localhost:3000
pnpm --filter frontend build       # Production build with Next.js
pnpm --filter frontend start       # Run production build
pnpm --filter frontend type-check  # TypeScript validation
```

### Backend Commands
```bash
pnpm --filter backend dev          # Dev server on http://localhost:4000
pnpm --filter backend build        # Compile TypeScript to dist/
pnpm --filter backend start        # Run compiled server from dist/
pnpm --filter backend type-check   # TypeScript validation
```

### Shared Package Commands
```bash
pnpm --filter "@barcode-generator/shared" build  # Compile shared types/schemas
```

## Architecture

### Monorepo Structure
- **`frontend/`** - Next.js 16 (App Router) + React 19, Tailwind CSS 4, shadcn/ui components
- **`backend/`** - Express 4 + Node 20, bwip-js for server-side barcode generation
- **`shared/`** - Shared TypeScript types and Zod schemas used by both frontend/backend
- **`frontend-backup/`** - Backup of original Vite frontend (for reference)

### Hybrid Generation Pattern

**Critical architectural decision**: The app intelligently routes barcode generation based on quantity:

- **< 20 items**: Client-side generation using JsBarcode/qrcode.react (faster, no network overhead)
- **≥ 20 items**: Server-side generation via API using bwip-js + Sharp (optimized, streams ZIP)

**Implementation**: `frontend/lib/hybridRouting.ts` contains the routing logic and threshold determination.

### API Architecture

**Single endpoint**: `POST /api/barcode/generate`
- Request: Zod-validated BarcodeConfig + data array
- Response: ZIP file stream containing generated barcode images
- CORS: Enabled for `http://localhost:3000`
- Limits: 1000 barcodes max (server enforced), 5MB file upload limit

**Health check**: `GET /health` - Used by frontend to determine server availability

### Type Safety System

All three packages use TypeScript strict mode with shared Zod schemas:

1. **Shared types** defined in `shared/src/types/barcode.types.ts`
2. **Zod schemas** in `shared/src/schemas/barcode.schemas.ts` for runtime validation
3. **Both frontend and backend** import from `@barcode-generator/shared`

When modifying types:
1. Update `shared/src/types/barcode.types.ts`
2. Update corresponding Zod schema in `shared/src/schemas/barcode.schemas.ts`
3. Run `pnpm --filter "@barcode-generator/shared" build`
4. Changes automatically available to frontend/backend via workspace dependency

### Frontend Component Structure (Next.js App Router)

**Multi-step workflow**:
- `components/step-one.tsx` - Data input (manual/CSV with PapaParse/sequential generator)
- `components/step-two.tsx` - Barcode configuration (dimensions, fonts, display options)
- `components/step-three.tsx` - Generation with progress modal and hybrid routing

**Key files**:
- `app/page.tsx` - Main page component with state management
- `app/layout.tsx` - Root layout with ThemeProvider
- `lib/hybridRouting.ts` - Client/server routing logic
- `lib/barcodeGenerator.ts` - Client-side barcode generation
- `lib/zipGenerator.ts` - ZIP file creation
- `lib/apiClient.ts` - Backend API communication
- `lib/localStorage.ts` - Configuration persistence

**State management**: React useState + useEffect + localStorage for persistence

### Backend Service Layer

`backend/src/services/barcode.service.ts` contains core generation logic:
- Validates input with shared Zod schemas
- Generates barcodes using bwip-js
- Processes images with Sharp
- Streams ZIP file using Archiver

Error handling: `backend/src/middleware/error-handler.ts` provides global Express error handling.

## Key Development Notes

### Path Aliases
Both frontend and backend use `@/*` for relative imports:
```typescript
// Frontend (Next.js)
import { BarcodeConfig } from '@/types/barcode'  // Maps to frontend root
import { generateBarcodes } from '@/lib/barcodeGenerator'

// Backend
import { BarcodeConfig } from '@/types'  // Maps to backend/src/types
```

### Barcode Libraries
- **Client-side**: JsBarcode (1D barcodes), qrcode.react (QR codes)
- **Server-side**: bwip-js (all types with high quality output)
- **Supported types**: Code128, QR, EAN-13, EAN-8, UPC-A, Code39

### Configuration Options
- Dimensions (width/height in cm or inches)
- Google Fonts (17+ fonts available)
- Text display toggle
- Stretch mode
- Dual barcode mode (generates 2 versions per data item)

### Build Dependencies
The build order matters due to workspace dependencies:
```
shared (build first) → frontend → backend
```

This is enforced in root `package.json` build script.

### Next.js API Rewrites
`frontend/next.config.mjs` rewrites `/api` and `/health` routes to `http://localhost:4000` for local development.

## Current Development Phase

**Phase 7 (Polish)** - Complete and functional. Next phases:
- Phase 8: Testing (Vitest for units, Playwright for E2E)
- Phase 9: Deployment and documentation

## Performance Characteristics

- Client generation: ~50ms per barcode
- Server generation: ~30ms per barcode + ZIP streaming
- Threshold switching at 20 items balances UX and performance
- Default limit: 200 barcodes (configurable 1-1000)
