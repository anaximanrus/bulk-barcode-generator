# 🏷️ Bulk Barcode Generator

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-green.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-8.0+-orange.svg)](https://pnpm.io/)

A professional, full-stack web application for generating barcodes in bulk with extensive customization options. Built with modern technologies and designed for production use.

## ✨ Features

### 🎯 Core Functionality
- **Bulk Generation**: Generate up to 1000 barcodes in a single batch
- **Multiple Formats**: Support for Code 128, QR Code, EAN-13, EAN-8, UPC-A, Code 39
- **Smart Input**: CSV/TXT file upload, manual entry, or paste from clipboard
- **Dual Mode**: Generate two versions of each barcode with different dimensions
- **Ignore Digits**: Remove leading or trailing digits before encoding

### 🎨 Customization
- **Dimensions**: Custom width and height in cm or inches
- **Custom Fonts**: 5 Google Fonts (Roboto, Open Sans, Lato, Montserrat, Courier Prime)
- **Font Size**: Adjustable from 8px to 48px
- **Text Display**: Toggle barcode value display
- **Stretch Mode**: Fit barcodes to exact dimensions

### 💻 User Experience
- **Dark Mode**: Full dark/light theme support
- **Live Preview**: Real-time barcode preview with actual data
- **Configurable Limits**: Set custom generation limits
- **Persistent Settings**: Configuration saved in localStorage
- **Responsive Design**: Works on desktop and mobile devices

### ⚡ Performance
- **Hybrid Generation**: Client-side for <20 items, server-side for ≥20 items
- **Optimized Images**: PNG output with Sharp image processing
- **ZIP Download**: All barcodes packaged in a single archive
- **Rate Limiting**: Built-in API rate limiting for protection

### 🐳 Deployment
- **Docker Support**: Multi-container and single-container options
- **Production Ready**: Multi-stage builds, health checks, optimized images
- **Monorepo Structure**: pnpm workspaces with shared TypeScript packages

## 🚀 Quick Start

### Prerequisites

- **Node.js**: ≥20.0.0
- **pnpm**: ≥8.0.0
- **Docker** (optional): For containerized deployment

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/barcode-generator.git
cd barcode-generator

# Install dependencies
pnpm install

# Build shared package
pnpm --filter "@barcode-generator/shared" build

# Start development servers
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

## 📦 Project Structure

```
barcode-generator/
├── frontend/              # Next.js 16 frontend application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities and helpers
│   └── types/           # TypeScript type definitions
├── backend/              # Express.js backend API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   └── schemas/     # Zod validation schemas
│   └── fonts/           # Custom Google Fonts for barcodes
├── shared/               # Shared TypeScript types/schemas
│   └── src/
└── docker/              # Docker configuration files
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: React hooks + localStorage
- **Barcode Libraries**: jsbarcode, qrcode.react
- **Form Handling**: react-hook-form + Zod validation

### Backend
- **Runtime**: Node.js 20 with ES Modules
- **Framework**: Express.js 4.21
- **Language**: TypeScript 5.9
- **Barcode Generation**: bwip-js (with custom font support)
- **Image Processing**: Sharp
- **Validation**: Zod schemas
- **Archive Creation**: Archiver

### Development
- **Monorepo**: pnpm workspaces
- **Package Manager**: pnpm 8+
- **Type Checking**: TypeScript strict mode
- **Code Quality**: ESLint + Prettier

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (optional)
- **Health Checks**: Built-in container monitoring

## 🔧 Configuration

### Environment Variables

Create `.env` files in the respective directories:

**Backend** (`backend/.env`):
```env
NODE_ENV=production
PORT=4000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Custom Font Support

The backend includes 5 Google Fonts for barcode text rendering:
- Roboto (partial support)
- Open Sans (partial support)
- Lato ✅
- Montserrat (partial support)
- Courier Prime ✅

Fonts are loaded at startup from `backend/fonts/`. See [font implementation details](backend/src/services/fontLoader.ts).

## 🐳 Docker Deployment

### Option 1: Multi-Container (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Single Container

```bash
# Build image
docker build -f Dockerfile.all -t barcode-generator .

# Run container
docker run -d \
  --name barcode-app \
  -p 3000:3000 \
  -p 4000:4000 \
  barcode-generator
```

See [Docker Documentation](README-DOCKER.md) for detailed deployment guides.

## 📖 API Documentation

### Generate Barcodes

**Endpoint**: `POST /api/barcode/generate`

**Request Body**:
```json
{
  "data": ["12345", "67890"],
  "configuration": {
    "type": "code128",
    "dimensions": {
      "width": 5,
      "height": 3,
      "unit": "cm"
    },
    "font": {
      "family": "Lato",
      "size": 12
    },
    "options": {
      "showText": true,
      "stretch": false,
      "ignoreDigits": {
        "enabled": true,
        "position": "start",
        "count": 5
      }
    },
    "dualMode": false
  }
}
```

**Response**: ZIP file containing generated barcode images

**Supported Barcode Types**:
- `code128`: Code 128 (alphanumeric)
- `qr`: QR Code (2D)
- `ean13`: EAN-13 (13 digits)
- `ean8`: EAN-8 (8 digits)
- `upca`: UPC-A (12 digits)
- `code39`: Code 39 (alphanumeric)

## 🎯 Use Cases

- **Retail**: Product labeling and inventory management
- **Logistics**: Shipping labels and package tracking
- **Events**: Ticket generation and access control
- **Manufacturing**: Asset tracking and quality control
- **Healthcare**: Patient identification and medication tracking
- **Education**: Library management and student ID cards

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
pnpm dev
pnpm type-check
pnpm lint

# Commit with descriptive message
git commit -m "feat: add your feature description"

# Push and create pull request
git push origin feature/your-feature-name
```

## 📝 Changelog

### Version 1.0.0 (2025-01-28)
- ✨ Initial release
- 🎨 Full customization support (dimensions, fonts, colors)
- 📦 Bulk generation up to 1000 barcodes
- 🐳 Docker support (multi-container and single-container)
- 🌙 Dark mode support
- ⚡ Hybrid client/server generation
- 🔧 Ignore digits feature
- 🎯 Dual mode generation

## 🔒 Security

- **Rate Limiting**: API endpoints protected with express-rate-limit
- **Input Validation**: Zod schemas for all user inputs
- **CORS Configuration**: Configurable CORS policies
- **Docker Security**: Non-root user execution, minimal base images
- **Type Safety**: Full TypeScript coverage

## 📊 Performance

- **Image Optimization**: Multi-stage Docker builds (60-70% size reduction)
- **Layer Caching**: Optimized Dockerfile ordering for fast rebuilds
- **Hybrid Generation**: Automatic client/server delegation based on batch size
- **Health Checks**: Automated container monitoring
- **Resource Limits**: Configurable CPU and memory constraints

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Find and kill process using port
lsof -i :3000
kill -9 <PID>
```

**Build Errors**:
```bash
# Clear cache and rebuild
rm -rf node_modules .next dist
pnpm install
pnpm build
```

**Docker Issues**:
```bash
# Clean Docker system
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

See [Docker Troubleshooting](README-DOCKER.md#troubleshooting) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [bwip-js](https://github.com/metafloor/bwip-js) - Barcode generation engine
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Google Fonts](https://fonts.google.com/) - Custom font support

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/barcode-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/barcode-generator/discussions)
- **Documentation**: [README-DOCKER.md](README-DOCKER.md)

---

Made with ❤️ using TypeScript, Next.js, and Express.js

**Star ⭐ this repository if you find it useful!**
