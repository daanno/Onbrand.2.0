# QA Process Setup - Module-Level Code Quality

## Overview

This document outlines the complete QA (Quality Assurance) process implemented for the ACT 2.0 project at the module/code level. The setup ensures code quality, consistency, and reliability through automated testing, linting, formatting, and pre-commit hooks.

## Architecture

### QA Stack Components

```
┌─────────────────────────────────────────────────────────┐
│                    QA Process Flow                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Developer writes code                                   │
│         ↓                                                │
│  Pre-commit hooks (Husky + lint-staged)                 │
│         ↓                                                │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   ESLint     │  │   Prettier   │                    │
│  │  Auto-fix    │  │  Auto-format │                    │
│  └──────────────┘  └──────────────┘                    │
│         ↓                                                │
│  Commit succeeds if checks pass                         │
│         ↓                                                │
│  CI/CD Pipeline                                         │
│         ↓                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │TypeScript│ │ ESLint   │ │  Vitest  │ │Playwright│ │
│  │  Check   │ │  Lint    │ │  Tests   │ │ E2E Tests│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│         ↓                                                │
│  Deploy if all checks pass                              │
└─────────────────────────────────────────────────────────┘
```

## Tools & Technologies

### 1. ESLint - Static Code Analysis
**Purpose**: Catch bugs, enforce code standards, maintain consistency

**Configuration**: `eslint.config.mjs`

**Key Rules**:
- TypeScript strict mode
- No unused variables (with `_` prefix exception)
- React hooks rules enforcement
- Prefer `const` over `let`
- Strict equality (`===`)
- No `console.log` (warnings, allows `console.error`)

**Usage**:
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### 2. Prettier - Code Formatting
**Purpose**: Automatic, consistent code formatting

**Configuration**: `.prettierrc`

**Features**:
- Semicolons enabled
- Double quotes
- 100 character line width
- 2 space indentation
- Tailwind CSS class sorting (via plugin)

**Usage**:
```bash
npm run format          # Format all files
npm run format:check    # Check without fixing
```

### 3. TypeScript - Type Safety
**Purpose**: Static type checking, catch type errors at compile time

**Configuration**: `tsconfig.json`

**Usage**:
```bash
npm run type-check    # Run TypeScript compiler check
```

### 4. Vitest - Unit & Integration Testing
**Purpose**: Fast, modern testing framework for unit and integration tests

**Configuration**: `vitest.config.ts`

**Features**:
- React Testing Library integration
- JSdom environment for DOM testing
- Coverage reports (v8 provider)
- Watch mode for development
- UI mode for debugging

**Test Structure**:
```
src/__tests__/
├── setup.ts                           # Global test setup
├── components/
│   └── ui/
│       └── card.test.tsx              # Component tests
├── lib/
│   └── utils.test.ts                  # Utility tests
└── example.integration.test.tsx       # Integration tests
```

**Usage**:
```bash
npm run test              # Run tests in watch mode
npm run test:ui           # Run with UI
npm run test:coverage     # Generate coverage report
```

### 5. Playwright - E2E Testing
**Purpose**: End-to-end browser testing

**Configuration**: `playwright.config.ts` (root level)

**Features**:
- Cross-browser testing (Chromium, Firefox, WebKit)
- Screenshot on failure
- Trace on retry
- HTML reporter

**Usage**:
```bash
npm run test:e2e       # Run E2E tests
npm run test:e2e:ui    # Run with UI
```

### 6. Husky + lint-staged - Pre-commit Hooks
**Purpose**: Run checks automatically before commits

**Configuration**: 
- `.husky/pre-commit` - Hook script
- `.lintstagedrc.json` - Rules for staged files

**What Runs on Commit**:
```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,scss}": ["prettier --write"]
}
```

## Installation

All dependencies are already installed. If you need to reinstall:

```bash
cd frontend_next
npm install
```

**Installed Packages**:
- `prettier` - Code formatter
- `prettier-plugin-tailwindcss` - Tailwind class sorting
- `vitest` - Test framework
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@vitejs/plugin-react` - Vite React plugin
- `jsdom` - DOM implementation for Node
- `husky` - Git hooks manager
- `lint-staged` - Run commands on staged files
- `@typescript-eslint/*` - TypeScript ESLint plugins
- `eslint-plugin-react*` - React ESLint plugins

## Scripts Reference

### Development Scripts
```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run start            # Start production server
```

### QA Scripts
```bash
# Complete QA check (recommended before push)
npm run qa               # type-check + lint + format:check + test

# Complete QA with auto-fix
npm run qa:fix           # type-check + lint:fix + format
```

### Individual Check Scripts
```bash
# Linting
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors

# Formatting
npm run format           # Format all files
npm run format:check     # Check formatting without fixing

# Type Checking
npm run type-check       # Run TypeScript compiler check

# Unit/Integration Testing
npm run test             # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report
npm run test:watch       # Run tests in watch mode (explicit)

# E2E Testing
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run Playwright with UI
```

## Workflow & Best Practices

### Daily Development Workflow

1. **Write Code**
   - Follow TypeScript types
   - Use ESLint suggestions in IDE
   - Format on save (if IDE configured)

2. **Write Tests**
   - Unit tests for utilities/hooks
   - Component tests for UI components
   - Integration tests for feature flows

3. **Before Committing**
   ```bash
   npm run qa:fix    # Auto-fix issues
   npm run qa        # Verify all checks pass
   ```

4. **Commit**
   - Pre-commit hooks run automatically
   - ESLint and Prettier fix staged files
   - Commit fails if unfixable issues exist

5. **Before Pushing**
   ```bash
   npm run qa              # Full QA check
   npm run test:e2e        # Run E2E tests
   ```

### Writing Tests

#### Component Test Example
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

#### Utility Test Example
```ts
import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/utils";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("Jan 15, 2024");
  });

  it("handles invalid dates", () => {
    expect(formatDate(null)).toBe("Invalid date");
  });
});
```

### Code Quality Standards

#### TypeScript
- ✅ Use explicit types for function parameters
- ✅ Avoid `any` type (use `unknown` if needed)
- ✅ Use type inference for simple cases
- ❌ Don't use `@ts-ignore` without comment

#### React
- ✅ Use functional components with hooks
- ✅ Follow hooks rules (no conditional hooks)
- ✅ Memoize expensive computations
- ✅ Use proper dependency arrays
- ❌ Don't mutate state directly

#### General
- ✅ Use `const` by default, `let` when needed
- ✅ Use strict equality (`===`)
- ✅ Add curly braces to all control structures
- ✅ Prefix unused variables with `_`
- ❌ Don't leave `console.log` statements
- ❌ Don't use `var`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: QA Checks

on: [push, pull_request]

jobs:
  qa:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend_next
        
      - name: Run QA checks
        run: npm run qa
        working-directory: ./frontend_next
        
      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: ./frontend_next
```

## Coverage Reports

### Generating Coverage

```bash
npm run test:coverage
```

### Viewing Coverage

**Terminal Output**: Summary in console

**HTML Report**: Open `coverage/index.html` in browser

**Coverage Goals**:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## Troubleshooting

### Pre-commit Hook Not Running

```bash
# Reinstall Husky
npm run prepare
```

### Tests Failing

```bash
# Run with UI for debugging
npm run test:ui

# Check specific test file
npx vitest run src/__tests__/path/to/test.test.tsx
```

### ESLint Errors

```bash
# See all errors
npm run lint

# Auto-fix what's possible
npm run lint:fix

# Check specific file
npx eslint src/path/to/file.tsx
```

### TypeScript Errors

```bash
# See all type errors
npm run type-check

# Check specific file
npx tsc --noEmit src/path/to/file.tsx
```

### Prettier Conflicts with ESLint

Prettier is configured to run after ESLint in lint-staged, so formatting should not conflict. If issues persist:

```bash
# Format first, then lint
npm run format
npm run lint:fix
```

## Configuration Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `eslint.config.mjs` | ESLint rules and settings | `frontend_next/` |
| `.prettierrc` | Prettier formatting rules | `frontend_next/` |
| `.prettierignore` | Files to exclude from formatting | `frontend_next/` |
| `vitest.config.ts` | Vitest test configuration | `frontend_next/` |
| `.lintstagedrc.json` | Pre-commit hook configuration | `frontend_next/` |
| `.husky/pre-commit` | Git pre-commit hook script | `frontend_next/` |
| `tsconfig.json` | TypeScript configuration | `frontend_next/` |
| `playwright.config.ts` | Playwright E2E configuration | Root |

## Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all (careful!)
npm update
```

### Adding New ESLint Rules

Edit `eslint.config.mjs`:

```js
{
  rules: {
    "new-rule-name": "error",
  }
}
```

### Adding New Test Patterns

Edit `vitest.config.ts`:

```ts
export default defineConfig({
  test: {
    // Add new patterns
  }
})
```

## Resources

- **Vitest Documentation**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Playwright Documentation**: https://playwright.dev/
- **ESLint Rules**: https://eslint.org/docs/rules/
- **Prettier Options**: https://prettier.io/docs/en/options.html
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **Husky Documentation**: https://typicode.github.io/husky/

## Summary

The QA process is now fully automated and integrated into the development workflow:

✅ **ESLint** - Catches code quality issues
✅ **Prettier** - Ensures consistent formatting  
✅ **TypeScript** - Provides type safety
✅ **Vitest** - Unit & integration testing
✅ **Playwright** - E2E testing
✅ **Husky** - Pre-commit automation

**Result**: High code quality, fewer bugs, consistent codebase, faster reviews.

---

**Last Updated**: November 28, 2024  
**Maintained By**: ACT 2.0 Development Team
