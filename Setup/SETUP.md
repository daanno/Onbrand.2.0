# ACT 2.0 - Complete Setup Guide

This guide will walk you through setting up the ACT 2.0 development environment from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Supabase Setup](#supabase-setup)
5. [Installation](#installation)
6. [Running the Project](#running-the-project)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ ([Install Guide](https://pnpm.io/installation))
- **Git** ([Download](https://git-scm.com/))
- **Supabase CLI** (optional, for local development)

### Required Accounts & Keys

- **Supabase Account** with project ID: `pyvobennsmzyvtaceopn`
- **OpenAI API Key** ([Get Key](https://platform.openai.com/api-keys))
- **Anthropic API Key** (optional, [Get Key](https://console.anthropic.com/))
- **Replicate API Token** (optional, [Get Token](https://replicate.com/))

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check pnpm version
pnpm --version  # Should be 8.0.0 or higher

# Check Git
git --version

# Check Supabase CLI (if installed)
supabase --version
```

---

## Initial Setup

### 1. Clone or Navigate to Project

```bash
cd /Users/dwayne/Documents/Playground/Onbrand.2.0
```

### 2. Install pnpm (if not already installed)

```bash
# macOS
brew install pnpm

# Or using npm
npm install -g pnpm

# Or using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 3. Install Project Dependencies

```bash
pnpm install
```

This will install all dependencies for the root workspace and all packages.

---

## Environment Configuration

### 1. Create Environment Files

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 2. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (ID: `pyvobennsmzyvtaceopn`)
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. Configure Environment Variables

Edit `.env.local` and fill in your values:

```bash
# Supabase Configuration
SUPABASE_URL=https://pyvobennsmzyvtaceopn.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# Supabase Edge Functions
SUPABASE_FUNCTIONS_URL=https://pyvobennsmzyvtaceopn.functions.supabase.co

# AI Services
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
REPLICATE_API_TOKEN=r8_your_replicate_token_here

# Social Analytics (if using)
SOCIAL_ANALYTICS_KEY=your_social_analytics_key_here

# Next.js Public Variables
NEXT_PUBLIC_SUPABASE_URL=https://pyvobennsmzyvtaceopn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Environment
NODE_ENV=development
```

**Important Notes:**
- Never commit `.env.local` to git (it's already in `.gitignore`)
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security - keep it secret!
- Public variables (starting with `NEXT_PUBLIC_`) are exposed to the browser

---

## Supabase Setup

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### 3. Link Your Project

```bash
supabase link --project-ref pyvobennsmzyvtaceopn
```

You'll be prompted to enter your database password. You can find it in:
- Supabase Dashboard → **Settings** → **Database** → **Database password**

### 4. Verify Connection

```bash
supabase projects list
```

You should see your project listed.

### 5. (Optional) Start Local Supabase

For local development with a local Supabase instance:

```bash
# Start local Supabase (requires Docker)
supabase start

# This will output:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Anon key: eyJhbGci...
# Service role key: eyJhbGci...

# Update .env.local with local URLs if using local instance
```

---

## Installation

### 1. Install All Dependencies

```bash
# From project root
pnpm install
```

This installs dependencies for:
- Root workspace
- `brands/act-frontend`
- `packages/auth`
- `packages/tenant-config`
- `packages/ui`

### 2. Verify Installation

```bash
# Check that all packages are installed
pnpm list --depth=0

# Verify TypeScript compilation
pnpm type-check
```

---

## Running the Project

### Development Server

Start the development server:

```bash
# From project root
pnpm dev

# Or directly from frontend
cd brands/act-frontend
pnpm dev
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Supabase Studio** (if local): http://localhost:54323

### Available Scripts

#### Root Level

```bash
# Development
pnpm dev                    # Start dev server (act-frontend)

# Building
pnpm build                  # Build all packages

# Testing
pnpm test                   # Run all tests
pnpm test:ui                # Run tests with UI
pnpm test:coverage          # Generate coverage report
pnpm test:e2e              # Run E2E tests with Playwright

# Code Quality
pnpm lint                   # Lint all packages
pnpm lint:fix              # Auto-fix linting issues
pnpm format                # Format all code
pnpm format:check          # Check formatting
pnpm type-check            # Type check all packages
pnpm qa                    # Run full QA (type-check + lint + format + test)
pnpm qa:fix                # Run QA with auto-fixes
```

#### Package Level

```bash
# Run commands for specific package
pnpm --filter act-frontend dev
pnpm --filter @act/auth type-check
pnpm --filter @act/tenant-config lint
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write code following TypeScript strict mode
- Use ESLint suggestions in your IDE
- Format code on save (if configured)

### 3. Run QA Checks

Before committing:

```bash
# Auto-fix issues
pnpm qa:fix

# Verify all checks pass
pnpm qa
```

### 4. Commit Your Changes

Pre-commit hooks will automatically:
- Run ESLint and fix issues
- Format code with Prettier

```bash
git add .
git commit -m "feat: your feature description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

---

## Project Structure

```
Onbrand.2.0/
├── brands/                    # Brand-specific frontend applications
│   └── act-frontend/        # Next.js 15 app
│       ├── app/              # Next.js App Router
│       │   ├── api/          # API routes (AI SDK endpoints)
│       │   │   ├── chat/     # Chat API with streaming
│       │   │   └── ai/       # General AI API
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                  # Shared packages
│   ├── auth/                 # Authentication package
│   │   ├── src/
│   │   │   ├── auth-client.ts
│   │   │   ├── types.ts      # User, BrandUser, BrandRole types
│   │   │   └── validation.ts # Zod schemas
│   │   └── package.json
│   │
│   ├── tenant-config/        # Brand configuration
│   │   ├── src/
│   │   │   └── index.ts      # Brand configs (ACME, Globex)
│   │   └── package.json
│   │
│   └── ui/                   # Shared UI components
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── supabase/                 # Supabase configuration
│   ├── config.toml           # CLI configuration
│   ├── migrations/           # Database migrations
│   └── functions/            # Edge functions
│
├── .env.example              # Environment template
├── .env.local                # Local environment (git-ignored)
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # Workspace definition
├── tsconfig.json             # Root TypeScript config
└── README.md                 # Project documentation
```

---

## Key Features

### AI SDK Integration

The project uses [Vercel AI SDK](https://ai-sdk.dev/) for all AI interactions:

- **Streaming Chat**: `app/api/chat/route.ts` - Real-time streaming responses
- **Text Generation**: `app/api/ai/route.ts` - Generate text or structured objects
- **Multiple Providers**: OpenAI, Anthropic (via AI SDK)

### Brand Access Levels

The system supports role-based access control:

- **owner** - Full access, can manage all aspects
- **admin** - Administrative access, can manage users and content
- **editor** - Can create and edit content
- **reviewer** - Can review and approve content
- **user** - Basic access, view-only

### Monorepo Architecture

- **pnpm workspaces** for package management
- **Shared packages** for code reuse
- **TypeScript path aliases** for clean imports
- **Independent versioning** per package

---

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Generate coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Run Playwright tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui
```

### Writing Tests

Tests should be placed in:
- `__tests__/` directories for unit tests
- `e2e/` directory for E2E tests

---

## Troubleshooting

### Issue: Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: TypeScript Errors

```bash
# Check for type errors
pnpm type-check

# Check specific package
pnpm --filter act-frontend type-check
```

### Issue: Supabase Connection Failed

1. Verify project ID in `supabase/config.toml`
2. Check environment variables are set correctly
3. Ensure Supabase project is active in dashboard
4. Verify network connectivity

### Issue: ESLint Peer Dependency Warnings

These warnings are expected with Next.js 15 and ESLint 9. They don't affect functionality. The project uses Next.js's ESLint config which is compatible.

### Issue: Port 3000 Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Issue: Pre-commit Hooks Not Running

```bash
# Reinstall Husky
pnpm run prepare

# Or manually install
npx husky install
```

### Issue: AI SDK Not Working

1. Verify `OPENAI_API_KEY` is set in `.env.local`
2. Check API key is valid and has credits
3. Verify network connectivity
4. Check browser console for errors

---

## Next Steps

After completing setup:

1. **Set up Database Schema**
   - See `Setup/SUPABASE_SETUP.md` for database setup
   - Run migrations: `supabase db push`

2. **Configure Authentication**
   - See `Setup/SUPABASE_SETUP.md` for auth setup
   - Configure providers in Supabase dashboard

3. **Deploy Edge Functions**
   - See `Setup/EDGE_FUNCTIONS_SETUP.md` for edge functions
   - Deploy: `supabase functions deploy`

4. **Set up CI/CD**
   - Configure GitHub Actions or similar
   - Set up environment secrets

5. **Configure Production**
   - Create production Supabase project
   - Set up production environment variables
   - Configure deployment pipeline

---

## Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://ai-sdk.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the documentation in `Setup/` directory
3. Check Supabase dashboard for project status
4. Verify all environment variables are set correctly

---

**Last Updated**: January 2025  
**Project**: ACT 2.0  
**Version**: 2.0.0

