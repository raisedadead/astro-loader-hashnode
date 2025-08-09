# Contributing to Astro Loader Hashnode

Thank you for your interest in contributing to Astro Loader Hashnode! This guide will help you get started with
development, testing, and releasing.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Commit Conventions](#commit-conventions)
- [Release Process](#release-process)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Updating Schemas](#updating-schemas)

## Development Setup

### Prerequisites

- Node.js 20 or higher
- pnpm 9.0 or higher
- Git

### Local Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/raisedadead/astro-loader-hashnode.git
   cd astro-loader-hashnode
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables (optional):**

   ```bash
   cp .env.example .env
   # Add your Hashnode token for testing with private content
   HASHNODE_TOKEN=your_token_here
   ```

4. **Run tests to ensure everything works:**
   ```bash
   pnpm run test
   ```

## Project Structure

This is a monorepo with the following structure:

```
astro-loader-hashnode/
├── packages/
│   └── astro-loader-hashnode/    # Main package
│       ├── src/
│       │   ├── index.ts          # Main entry point
│       │   ├── api/              # GraphQL client
│       │   ├── loaders/          # Content loaders
│       │   ├── queries/          # GraphQL queries
│       │   ├── types/            # TypeScript types
│       │   └── utils/            # Utility functions
│       └── tests/                # Test files
├── examples/
│   └── demo/                     # Example Astro site
├── .github/workflows/            # CI/CD workflows
└── docs/                         # Documentation
```

## Development Workflow

### Branch Strategy

- **`main`** - Production-ready code
- **Feature branches** - `feature/description` or `feat/description`
- **Bug fixes** - `fix/description` or `bugfix/description`
- **Hotfixes** - `hotfix/description`

### Making Changes

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/add-new-loader
   ```

2. **Make your changes** following the coding standards

3. **Run the development checks:**

   ```bash
   # Lint your code
   pnpm run lint

   # Fix linting issues automatically
   pnpm run lint:fix

   # Run type checking
   pnpm run typecheck

   # Run tests
   pnpm run test

   # Run all checks together
   pnpm run check
   ```

4. **Build the package:**

   ```bash
   pnpm run build
   ```

5. **Test with the example:**
   ```bash
   cd examples/demo
   pnpm install
   pnpm run dev
   ```

### Available Scripts

From the root directory:

```bash
# Core development commands
pnpm run build          # Build the package
pnpm run test           # Run tests
pnpm run test:coverage  # Run tests with coverage
pnpm run test:watch     # Run tests in watch mode
pnpm run test:ui        # Run tests with UI
pnpm run lint           # Run linting
pnpm run lint:fix       # Fix linting issues
pnpm run typecheck      # Run type checking
pnpm run format         # Format code
pnpm run format:check   # Check formatting
pnpm run check          # Run all checks (lint + typecheck + test)
pnpm run clean          # Clean build artifacts
pnpm run audit          # Check for security vulnerabilities

# Release commands
pnpm run release        # Run semantic-release
```

### Debug Mode

Enable debug logging in your test Astro config:

```javascript
// astro.config.mjs
export default defineConfig({
  vite: {
    logLevel: 'info',
  },
});
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Run tests with UI
pnpm run test:ui
```

### Writing Tests

- Tests are written using Vitest
- Place test files in the `tests/` directory
- Use descriptive test names
- Mock external dependencies (GraphQL API calls)
- Test both success and error scenarios

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { hashnodeLoader } from '../src/index';

describe('hashnodeLoader', () => {
  it('should create loader with correct configuration', () => {
    // Test implementation
  });
});
```

## Commit Conventions

We use [Conventional Commits](https://conventionalcommits.org/) for consistent commit messages and automated versioning.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat** - New features (minor version bump)
- **fix** - Bug fixes (patch version bump)
- **perf** - Performance improvements (patch version bump)
- **docs** - Documentation changes (no version bump)
- **style** - Code style changes (no version bump)
- **refactor** - Code refactoring (no version bump)
- **test** - Test changes (no version bump)
- **chore** - Build/tooling changes (no version bump)
- **ci** - CI/CD changes (no version bump)

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```bash
# Either
git commit -m "feat!: redesign loader API"

# Or
git commit -m "feat: redesign loader API

BREAKING CHANGE: The configuration format has changed.
See migration guide for details."
```

### Examples

```bash
# Feature addition (minor release)
git commit -m "feat: add series loader support"

# Bug fix (patch release)
git commit -m "fix: resolve caching issue in GraphQL client"

# Performance improvement (patch release)
git commit -m "perf: optimize query batching"

# Documentation (no release)
git commit -m "docs: update API documentation"

# Breaking change (major release)
git commit -m "feat!: redesign loader configuration API"
```

## Release Process

We use **manual workflow-triggered releases** with semantic-release for automation.

### Release Workflow

1. **Development happens on branches** - no releases are triggered
2. **Merge to main** - still no release
3. **Manual release trigger** - releases are created manually via GitHub Actions

### Creating a Release

1. **Ensure main branch is up to date and all changes are merged**

2. **Review changes since last release:**

   - Check recent commits and PRs merged to main
   - Verify all intended changes are included

3. **Trigger release via GitHub Actions:**

   - Go to [GitHub Actions](https://github.com/raisedadead/astro-loader-hashnode/actions)
   - Select the "Release" workflow
   - Click "Run workflow"
   - Choose your options:
     - **Release type**: `auto` (recommended), `patch`, `minor`, or `major`
     - **Dry run**: Check this to preview the release without publishing

4. **Version determination** (when using `auto`):
   - Semantic-release analyzes commits since last release:
     - Patch: `fix`, `perf` commits
     - Minor: `feat` commits
     - Major: commits with `!` or `BREAKING CHANGE`

### What Happens During Release

When you trigger the release workflow, GitHub Actions automatically:

1. ✅ Runs all tests and quality checks
2. ✅ Builds the package
3. ✅ Determines version based on conventional commits
4. ✅ Updates `package.json` version
5. ✅ Generates/updates `CHANGELOG.md`
6. ✅ Publishes to npm
7. ✅ Creates GitHub release with release notes
8. ✅ Commits changes back to main

### Dry Run (Recommended)

Before creating an actual release:

1. **Run a dry-run first**:

   - Go to GitHub Actions → Release workflow
   - Set "Dry run" to `true`
   - Review the output to confirm expected version and changes

2. **If satisfied, run the actual release**:
   - Run the workflow again with "Dry run" set to `false`

### Manual Release (for emergencies)

```bash
# Set required environment variables
export GITHUB_TOKEN=your_github_token
export NPM_TOKEN=your_npm_token

# Run semantic-release locally
pnpm run release
```

### Release Troubleshooting

- **Failed workflow**: Check GitHub Actions logs for detailed error messages
- **Wrong version**: Ensure conventional commit format is followed
- **Missing changes**: Verify all intended commits are merged to main before triggering release
- **Dry run errors**: Fix issues before running actual release

## Code Style

### Formatting

We use Prettier for consistent code formatting:

```bash
# Format all files
pnpm run format

# Check formatting
pnpm run format:check
```

### Linting

We use ESLint for code quality:

```bash
# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix
```

### TypeScript

- Use strict TypeScript
- Export types from `src/types/index.ts`
- Use Zod for runtime validation
- Document complex types with JSDoc

## Updating Schemas

When you add or modify fields returned by any loader:

1. Update the relevant Zod schema under `packages/astro-loader-hashnode/src/types/schema.ts`.
2. Update the corresponding transform function in the loader (e.g. `posts.ts` `transformHashnodePost`).
3. Add or adjust tests asserting the new field appears in stored `data` and, if relevant, in the `rendered` output.
4. Update both READMEs (root and package) if the change is user-visible (new option, new field, or behavior change).
5. Consider semantic versioning rules: new optional fields = minor, removed/changed fields = major.
6. If adding digest-impacting fields, no extra steps are needed; the digest is calculated from the full data object.

## Pull Request Process

### Before Submitting

1. ✅ Run `pnpm run check` - all checks must pass
2. ✅ Write tests for new features
3. ✅ Update documentation if needed
4. ✅ Use conventional commit messages
5. ✅ Ensure your branch is up to date with main

### PR Requirements

- **Title**: Use conventional commit format
- **Description**:
  - Explain what and why
  - Link to related issues
  - Include breaking changes if any
  - Add screenshots for UI changes

### Review Process

1. **Automated checks** must pass (CI, tests, linting)
2. **Code review** by maintainers
3. **Approval** required before merge
4. **Squash and merge** to keep history clean

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Updated documentation

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Commented code, particularly in hard-to-understand areas
- [ ] Changes generate no new warnings
```

## Troubleshooting

### Common Development Issues

1. **Tests failing**: Ensure all dependencies are installed with `pnpm install`
2. **Type errors**: Run `pnpm run typecheck` to see detailed type issues
3. **Linting errors**: Use `pnpm run lint:fix` to auto-fix most issues
4. **Build failures**: Check that you're using Node.js 20+ and pnpm 9+
5. **Publication not found**: Ensure your test `publicationHost` is correct
6. **API errors**: Check your token validity for private content access
7. **Network failures**: Cached content is used as fallback when API is unavailable

### Getting Your Hashnode API Token (for testing)

1. Go to [Hashnode Developer Settings](https://hashnode.com/settings/developer)
2. Generate a new Personal Access Token
3. Add it to your `.env` file as `HASHNODE_TOKEN`

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/raisedadead/astro-loader-hashnode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/raisedadead/astro-loader-hashnode/discussions)
- **Email**: For security issues only

## Resources

- [Astro Content Layer API](https://docs.astro.build/en/guides/content-collections/)
- [Hashnode GraphQL API](https://api.hashnode.com/)
- [Conventional Commits](https://conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

Thank you for contributing! 🚀
