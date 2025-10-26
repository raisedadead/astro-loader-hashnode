# GitHub Copilot Instructions for Astro Loader Hashnode

This document provides context and guidelines for GitHub Copilot when assisting with development in this repository.

## Project Overview

Astro Loader Hashnode is a powerful content loader for integrating Hashnode blog posts into Astro websites using the Astro Content Layer API. It provides seamless GraphQL integration with Hashnode's API, smart caching, and comprehensive TypeScript support.

### Key Features
- Built for Astro v5.0+ using the new Content Layer API
- GraphQL integration with Hashnode's API
- Smart caching with digest-based incremental loads
- Multiple specialized loaders (Posts, Series, Drafts, Search)
- Full TypeScript support with Zod schema validation
- Rendered HTML support for optimal performance

## Project Structure

```
astro-loader-hashnode/
├── packages/
│   └── astro-loader-hashnode/          # Main package
│       ├── src/
│       │   ├── index.ts                # Main entry point & exports
│       │   ├── api/
│       │   │   └── client.ts           # GraphQL client implementation
│       │   ├── loaders/
│       │   │   ├── base.ts             # Base loader functionality
│       │   │   ├── posts.ts            # Posts loader
│       │   │   ├── series.ts           # Series loader
│       │   │   ├── drafts.ts           # Drafts loader
│       │   │   └── search.ts           # Search loader
│       │   ├── queries/
│       │   │   └── index.ts            # GraphQL query definitions
│       │   ├── types/
│       │   │   ├── hashnode.ts         # Hashnode API types
│       │   │   ├── loader.ts           # Loader types
│       │   │   ├── loader-core.ts      # Core loader types
│       │   │   └── schema.ts           # Zod schemas
│       │   └── utils/
│       │       ├── content.ts          # Content processing
│       │       ├── date.ts             # Date utilities
│       │       ├── image-transform.ts  # Image URL transformations
│       │       ├── seo.ts              # SEO utilities
│       │       └── url.ts              # URL utilities
│       └── tests/                      # Test files mirror src structure
├── examples/
│   └── demo/                           # Demo Astro site
├── .github/workflows/                  # CI/CD workflows
└── vitest.config.ts                    # Test configuration
```

## Technology Stack

- **Runtime**: Node.js 20.x, 22.x, or 24.x
- **Package Manager**: pnpm >= 9 (currently 10.19.0)
- **Language**: TypeScript 5.9+
- **Framework**: Astro v5.0+ (peer dependency)
- **Validation**: Zod 3.25+
- **Testing**: Vitest 3.2+
- **Linting**: ESLint 9.38+ with TypeScript plugin
- **Formatting**: Prettier 3.6+
- **Git Hooks**: Husky 9.1+ with lint-staged

## Development Commands

### Core Commands
```bash
pnpm install              # Install dependencies
pnpm run build            # Build the package (TypeScript compilation)
pnpm run test             # Run all tests
pnpm run test:watch       # Run tests in watch mode
pnpm run test:coverage    # Run tests with coverage report
pnpm run test:ui          # Run tests with Vitest UI
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Auto-fix ESLint issues
pnpm run typecheck        # Run TypeScript type checking
pnpm run format           # Format code with Prettier
pnpm run format:check     # Check code formatting
pnpm run check            # Run lint + typecheck + test:coverage (CI check)
pnpm run audit            # Check for security vulnerabilities
```

### Release Commands
```bash
pnpm run release          # Run semantic-release (requires env vars)
pnpm run release:locally  # Run semantic-release in no-ci mode
```

## Code Style Guidelines

### TypeScript
- Use **strict TypeScript** settings
- Export all public types from `src/types/index.ts`
- Use Zod for runtime validation and schema definition
- Document complex types with JSDoc comments
- Prefer interfaces for object shapes, types for unions/intersections

### Code Formatting
- **Prettier** handles all formatting automatically
- Run `pnpm run format` before committing
- Pre-commit hooks will auto-format staged files

### Linting
- **ESLint** enforces code quality rules
- TypeScript-aware linting with `@typescript-eslint`
- Prettier integration to avoid conflicts
- Run `pnpm run lint:fix` to auto-fix issues

### Naming Conventions
- Files: `kebab-case.ts`
- Classes/Types/Interfaces: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE` (when truly constant)
- Private members: prefix with `_` (e.g., `_privateMethod`)

## Testing Guidelines

### Test Framework
- Use **Vitest** for all tests
- Tests are located in `packages/astro-loader-hashnode/tests/`
- Test files follow pattern: `*.test.ts`

### Test Structure
```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Testing Best Practices
- **Mock external dependencies** (GraphQL API calls, network requests)
- Test both **success and error scenarios**
- Use **descriptive test names** that explain what is being tested
- Aim for **high coverage** but focus on meaningful tests
- Test **edge cases** and boundary conditions
- Keep tests **isolated** and **independent**

### Running Tests
- Run full test suite before committing: `pnpm run test`
- Use watch mode during development: `pnpm run test:watch`
- Check coverage with: `pnpm run test:coverage`
- Current coverage target: 80%+ overall

## GraphQL Integration

### API Client
- Located in `src/api/client.ts`
- Handles all GraphQL requests to Hashnode API
- Implements retry logic and error handling
- Supports authentication via API token

### Query Definitions
- Located in `src/queries/index.ts`
- Use GraphQL query strings with tagged template literals
- Include only necessary fields to minimize payload size
- Support cursor-based pagination

### Best Practices
- Always handle network errors gracefully
- Implement proper loading states
- Use TypeScript types that match GraphQL schema
- Validate responses with Zod schemas

## Content Loader Architecture

### Base Loader (`src/loaders/base.ts`)
- Provides common functionality for all loaders
- Handles data fetching, caching, and digest calculation
- Implements the Astro Content Layer API interface

### Specialized Loaders
Each loader extends the base functionality:
- **Posts Loader**: Fetches published blog posts
- **Series Loader**: Fetches post series/collections
- **Drafts Loader**: Fetches draft posts (requires authentication)
- **Search Loader**: Fetches posts matching search terms

### Adding New Loaders
1. Create new file in `src/loaders/`
2. Extend base loader functionality
3. Define GraphQL query in `src/queries/`
4. Add transformation logic
5. Export from `src/index.ts`
6. Add tests in `tests/loaders-*.test.ts`
7. Update documentation

## Schema Management

### Zod Schemas (`src/types/schema.ts`)
- Define data structure and validation rules
- Used for both validation and TypeScript type inference
- Exported for user customization

### Updating Schemas
When adding or modifying fields:
1. Update Zod schema in `src/types/schema.ts`
2. Update transformation function in relevant loader
3. Add/update tests for new fields
4. Update documentation (README files)
5. Consider semantic versioning impact:
   - New optional fields = **minor** version
   - Modified/removed fields = **major** version

### Schema Export
- Schemas are exported from the package
- Users can extend or override schemas
- Maintains type safety across the API

## Commit Conventions

We follow [Conventional Commits](https://conventionalcommits.org/) for semantic versioning:

### Commit Types
- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `perf:` - Performance improvement (patch version bump)
- `docs:` - Documentation only changes
- `style:` - Code style/formatting changes
- `refactor:` - Code refactoring without functional changes
- `test:` - Test additions or modifications
- `chore:` - Build process or tooling changes
- `ci:` - CI/CD configuration changes

### Breaking Changes
- Add `!` after type: `feat!: redesign API`
- Or include `BREAKING CHANGE:` in commit body

### Commit Message Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples
```bash
feat: add support for co-authors in posts loader
fix: resolve date parsing issue for UTC timestamps
docs: update API documentation for series loader
test: add integration tests for search loader
chore: update dependencies to latest versions
```

## Release Process

### Semantic Release
- Releases are triggered **manually** via GitHub Actions
- Version is determined automatically from commit messages
- Process handles: version bump, changelog, npm publish, GitHub release

### Release Workflow
1. Changes are merged to `main` branch
2. Maintainer triggers release workflow in GitHub Actions
3. Can run dry-run to preview release
4. Supports manual version override (patch/minor/major)

### What Gets Released
- Package published to npm registry
- CHANGELOG.md updated automatically
- GitHub release created with notes
- Git tags created

## Contributing Workflow

### Before Starting
1. Check existing issues/PRs to avoid duplication
2. For major changes, open an issue first to discuss
3. Fork the repository and create a feature branch

### Development Cycle
1. Create feature branch: `git checkout -b feature/description`
2. Make changes following code style guidelines
3. Add/update tests for your changes
4. Run `pnpm run check` to validate all checks pass
5. Commit using conventional commit format
6. Push branch and open Pull Request

### Pull Request Requirements
- ✅ All CI checks must pass (lint, typecheck, tests)
- ✅ Tests added for new functionality
- ✅ Documentation updated if needed
- ✅ Conventional commit format in title
- ✅ Clear description of changes
- ✅ Link to related issues

### Review Process
- Automated checks run on all PRs
- Code review by maintainers required
- Squash merge to keep history clean

## Common Patterns

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof ZodError) {
    // Handle validation error
  } else if (error instanceof NetworkError) {
    // Handle network error
  } else {
    // Handle unknown error
  }
}
```

### Data Transformation
```typescript
// Always validate with Zod before transforming
const validatedData = schema.parse(rawData);

// Transform to internal format
const transformed = {
  ...validatedData,
  // Additional processing
};

return transformed;
```

### Async Operations
```typescript
// Prefer async/await over promises
async function fetchData() {
  const response = await client.query(query);
  return response;
}

// Handle errors appropriately
try {
  const data = await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw error;
}
```

## Performance Considerations

### Caching Strategy
- Implement digest-based change detection
- Skip unchanged content during rebuilds
- Store metadata for incremental updates

### Query Optimization
- Request only necessary fields
- Use cursor-based pagination for large datasets
- Batch requests when possible

### Build Optimization
- Rendered HTML provided to avoid re-rendering
- Selective field querying reduces payload size
- Smart defaults with user overrides

## Debugging Tips

### Common Issues
1. **GraphQL Errors**: Check API token validity and permissions
2. **Type Errors**: Ensure schema matches actual API response
3. **Build Failures**: Verify Node.js and pnpm versions
4. **Test Failures**: Check for unmocked external dependencies

### Debug Mode
Enable verbose logging in tests:
```typescript
vi.mock('../src/api/client', () => ({
  createClient: vi.fn(() => ({
    query: vi.fn(async () => {
      console.log('Query called with:', arguments);
      return mockResponse;
    })
  }))
}));
```

## Additional Resources

- [Astro Content Layer API](https://docs.astro.build/en/guides/content-layer/)
- [Hashnode GraphQL API](https://apidocs.hashnode.com/)
- [Conventional Commits](https://conventionalcommits.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Zod Documentation](https://zod.dev/)

## Security

- **Never commit** API tokens or secrets
- Use environment variables for sensitive data
- Report security issues privately to maintainers
- Run `pnpm audit` regularly to check dependencies

## Monorepo Context

This is a pnpm workspace monorepo:
- Main package in `packages/astro-loader-hashnode/`
- Example applications in `examples/`
- Shared configuration at root level
- Use workspace protocol for internal dependencies
