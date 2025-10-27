# Contributing to Bulk Barcode Generator

Thank you for your interest in contributing to the Bulk Barcode Generator project! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, personal appearance, race, ethnicity, age, religion, or nationality.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- Node.js ≥20.0.0
- pnpm ≥8.0.0
- Git
- TypeScript knowledge
- Familiarity with React/Next.js (for frontend)
- Familiarity with Express.js (for backend)

### Setting Up Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/barcode-generator.git
   cd barcode-generator
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/barcode-generator.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Build shared package**:
   ```bash
   pnpm --filter "@barcode-generator/shared" build
   ```

6. **Start development servers**:
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements
- `chore/description` - Build process, dependency updates

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Make your changes** in the appropriate workspace:
   - Frontend: `frontend/` directory
   - Backend: `backend/` directory
   - Shared types: `shared/` directory

2. **Test your changes**:
   ```bash
   # Run type checking
   pnpm type-check

   # Run linting
   pnpm lint

   # Test locally
   pnpm dev
   ```

3. **Build to verify**:
   ```bash
   pnpm build
   ```

## Coding Standards

### TypeScript

- **Strict mode**: All TypeScript must pass strict type checking
- **No `any` types**: Use proper types or `unknown` with type guards
- **Explicit return types**: For public functions and methods
- **Interface over Type**: Prefer `interface` for object shapes

**Example**:
```typescript
// ✅ Good
interface BarcodeConfig {
  type: BarcodeType
  dimensions: Dimensions
}

export function generateBarcode(config: BarcodeConfig): Promise<Buffer> {
  // implementation
}

// ❌ Bad
export function generateBarcode(config: any) {
  // implementation
}
```

### React/Next.js (Frontend)

- **Functional components**: Use function components with hooks
- **TypeScript props**: Always define prop types
- **Component organization**: One component per file
- **File naming**: Use PascalCase for components, kebab-case for utilities

**Example**:
```typescript
// ✅ Good
interface StepTwoProps {
  config: BarcodeConfig
  setConfig: (config: BarcodeConfig) => void
}

export function StepTwo({ config, setConfig }: StepTwoProps) {
  // implementation
}

// ❌ Bad
export function StepTwo(props: any) {
  // implementation
}
```

### Express.js (Backend)

- **Route organization**: Separate routes, controllers, and services
- **Error handling**: Use try-catch and error middleware
- **Validation**: Use Zod schemas for all inputs
- **Types**: Import types from shared package when possible

**Example**:
```typescript
// ✅ Good
export const barcodeRouter = Router()

barcodeRouter.post(
  '/generate',
  validateRequest(generateBarcodeRequestSchema),
  async (req: Request, res: Response) => {
    try {
      // implementation
    } catch (error) {
      // error handling
    }
  }
)

// ❌ Bad
app.post('/generate', (req, res) => {
  // no validation, weak types
})
```

### Code Style

- **ESLint**: Run `pnpm lint` before committing
- **Prettier**: Run `pnpm format` to format code
- **Line length**: Max 100 characters
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for TypeScript, double for JSX

## Commit Guidelines

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling
- `perf`: Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(frontend): add ignore digits configuration UI"

# Bug fix
git commit -m "fix(backend): resolve font loading issue for Roboto"

# Documentation
git commit -m "docs: update Docker deployment guide"

# Refactor
git commit -m "refactor(backend): extract barcode generation logic to service"
```

## Pull Request Process

### Before Submitting

1. **Update your branch**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   pnpm type-check
   pnpm lint
   pnpm build
   ```

3. **Test thoroughly**:
   - Test all affected features
   - Verify in both light and dark mode
   - Test with different barcode types
   - Check responsive design

### Submitting Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub with:
   - **Title**: Clear, descriptive summary
   - **Description**: What changes were made and why
   - **Testing**: How you tested the changes
   - **Screenshots**: For UI changes
   - **Breaking changes**: If any

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Build succeeds

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

### Review Process

- Maintainers will review your PR
- Address feedback and requested changes
- Once approved, your PR will be merged
- Delete your feature branch after merge

## Testing

### Manual Testing

1. **Start development servers**:
   ```bash
   pnpm dev
   ```

2. **Test scenarios**:
   - Upload CSV with 100 barcodes
   - Test all barcode types
   - Test dual mode generation
   - Test ignore digits feature
   - Test dark mode toggle
   - Test responsive layouts

### Type Checking

```bash
# Check all workspaces
pnpm type-check

# Check specific workspace
pnpm --filter frontend type-check
pnpm --filter backend type-check
```

### Linting

```bash
# Lint all workspaces
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

## Documentation

### When to Update Documentation

- Adding new features
- Changing existing functionality
- Modifying configuration options
- Updating dependencies
- Changing API endpoints

### Documentation Files

- **README.md**: Main project overview
- **README-DOCKER.md**: Docker deployment guide
- **CONTRIBUTING.md**: This file
- **Code comments**: For complex logic
- **JSDoc**: For public APIs

### Documentation Style

- Clear and concise
- Include code examples
- Use proper markdown formatting
- Add screenshots for UI features
- Keep examples up-to-date

## Project-Specific Guidelines

### Adding New Barcode Types

1. Update `BarcodeType` in `shared/src/types.ts`
2. Add type mapping in `backend/src/services/barcodeGenerator.ts`
3. Update frontend type selector in `frontend/components/step-two.tsx`
4. Add documentation in README.md
5. Test thoroughly

### Adding New Fonts

1. Download TTF file to `backend/fonts/`
2. Update `FONT_MAP` in `backend/src/services/fontLoader.ts`
3. Add font to list in `frontend/components/step-two.tsx`
4. Test font loading on startup
5. Document in README.md

### Modifying API Endpoints

1. Update Zod schema in `backend/src/schemas/`
2. Update route handler in `backend/src/routes/`
3. Update shared types in `shared/src/`
4. Update frontend API calls
5. Update API documentation in README.md

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/barcode-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/barcode-generator/discussions)
- **Documentation**: README.md, README-DOCKER.md

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- CHANGELOG.md for significant contributions
- README.md acknowledgments section

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Bulk Barcode Generator! 🎉
