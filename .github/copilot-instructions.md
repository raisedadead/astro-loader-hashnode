# GitHub Copilot Instructions

Context for AI-assisted development in this repository.

## Project

Astro Loader for Hashnode - Content loader integrating Hashnode blog posts into Astro v5+ sites via Content Layer API. Monorepo with main package and examples.

## Commands

```bash
pnpm run build            # Build package (tsc)
pnpm run test             # Run tests
pnpm run test:watch       # Watch mode
pnpm run test:coverage    # With coverage
pnpm run lint             # ESLint
pnpm run lint:fix         # Auto-fix
pnpm run typecheck        # Type check
pnpm run check            # All checks (lint + typecheck + test)
```

## Architecture

**Loader System** (`packages/astro-loader-hashnode/src/loaders/`)
- `base.ts` - `BaseHashnodeLoader` abstract class provides common functionality:
  - Client initialization, error handling, caching with digests
  - Implements Astro Loader interface (`load()` method)
  - Template method pattern for specific loaders
- `posts.ts`, `series.ts`, `drafts.ts`, `search.ts` - Concrete implementations
- Each loader implements: `fetchData()` and `transformItem()`

**Data Flow:**
1. Loader config → `BaseHashnodeLoader` → `HashnodeClient`
2. `load()` → `fetchData()` → GraphQL query
3. Raw data → `transformItem()` → Zod validation → Store with digest
4. Digest-based incremental updates skip unchanged content

**API Client** (`src/api/client.ts`)
- `HashnodeClient` wraps GraphQL API
- Features: request caching (5min TTL), timeout handling, pagination
- Methods: `getPosts()`, `searchPosts()`, `getDrafts()`, etc.

**Type System** (`src/types/`)
- `schema.ts` - Zod schemas for runtime validation
- `hashnode.ts` - Raw API types
- `loader.ts` - Loader configuration types

**Key Patterns:**
- Digest calculation for change detection: `packages/astro-loader-hashnode/src/loaders/base.ts:16`
- Pagination: `paginateResults()` generator at `packages/astro-loader-hashnode/src/loaders/base.ts:304`
- Error handling: `LoaderError` class at `packages/astro-loader-hashnode/src/loaders/base.ts:30`

## Code Standards

**Strict TypeScript Policy - ENFORCED:**
- **NEVER use `any`** - Use proper types or `unknown` with type guards
- **NEVER add ESLint ignore comments** (`eslint-disable-next-line`) - Fix the underlying issue
- All code must pass `pnpm run check` with zero errors

**Conventions:**
- Files: `kebab-case.ts`
- Classes/Types: `PascalCase`
- Functions/Variables: `camelCase`
- Export types from `src/types/index.ts`
- Use Zod for runtime validation
- Document complex types with JSDoc

**Testing:**
- Vitest framework
- Test files in `packages/astro-loader-hashnode/tests/`
- Mock external dependencies (GraphQL calls)
- Test success and error scenarios
- 80%+ coverage target

## Commit Format

Conventional Commits for semantic versioning:
- `feat:` - Minor version bump
- `fix:` / `perf:` - Patch version bump
- `feat!:` or `BREAKING CHANGE:` - Major version bump
- `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `ci:` - No version bump

## Schema Updates

When adding/modifying fields:
1. Update Zod schema in `src/types/schema.ts`
2. Update transform function in loader (e.g., `transformHashnodePost`)
3. Add tests
4. Update READMEs if user-visible
5. Semver: new optional fields = minor, removed/changed = major

## Entry Points

- `src/index.ts` - Main exports
- `hashnodeLoader()` - Primary convenience function
- `postsLoader()`, `seriesLoader()`, `draftsLoader()`, `searchLoader()` - Specific loaders
- All types, schemas, utilities exported

## Environment

- Node.js 20.x, 22.x, or 24.x
- pnpm >= 9 (currently 10.19.0)
- TypeScript 5.9+ (strict mode)
- Optional: `HASHNODE_TOKEN` for drafts/private content
