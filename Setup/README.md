# ACT 2.0 - Development Infrastructure

AI-powered brand management platform built with Next.js 15, Supabase, and Vercel AI SDK.

## Project Structure

```
Onbrand.2.0/
├── brands/                    # Brand-specific frontend applications
│   └── act-frontend/        # Example brand app (Next.js 15)
├── packages/                 # Shared packages
│   ├── auth/                # Authentication package
│   ├── tenant-config/        # Brand configuration
│   └── ui/                  # Shared UI components
├── supabase/                # Supabase configuration
│   ├── config.toml          # Supabase CLI config
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
└── docs/                    # Documentation
```

## Prerequisites

- Node.js 18+ 
- pnpm 8+
- Supabase CLI (optional, for local development)
- Supabase account with project ID: `pyvobennsmzyvtaceopn`

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (backend only)
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `ANTHROPIC_API_KEY` - Anthropic API key (optional)
- `REPLICATE_API_TOKEN` - Replicate API token (optional)

### 3. Link Supabase Project

```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref pyvobennsmzyvtaceopn
```

### 4. Start Development Server

```bash
# Start the frontend
pnpm dev

# Or start from root (runs act-frontend)
pnpm --filter act-frontend dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

### Root Level

- `pnpm dev` - Start development server
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm format` - Format all code
- `pnpm type-check` - Type check all packages
- `pnpm qa` - Run full QA checks (type-check + lint + format + test)

### Package Level

Each package has its own scripts:
- `type-check` - TypeScript type checking
- `lint` - ESLint
- `lint:fix` - Auto-fix ESLint issues

## Technology Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Vercel AI SDK (https://ai-sdk.dev/)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Package Manager**: pnpm workspaces
- **Testing**: Vitest, Playwright
- **Code Quality**: ESLint, Prettier, Husky

## AI SDK Integration

This project uses the [Vercel AI SDK](https://ai-sdk.dev/) for all AI interactions. The AI SDK is integrated via:

- API Routes: `app/api/chat/route.ts` and `app/api/ai/route.ts`
- Streaming support with `streamText`
- Object generation with `generateObject`
- Text generation with `generateText`

## Brand Access Levels

The system supports multiple access levels for brands:

- **owner** - Full access, can manage all aspects
- **admin** - Administrative access, can manage users and content
- **editor** - Can create and edit content
- **reviewer** - Can review and approve content
- **user** - Basic access, view-only

## Development Workflow

1. Create a feature branch
2. Make your changes
3. Run QA checks: `pnpm qa`
4. Commit (pre-commit hooks will run automatically)
5. Push and create a pull request

## Supabase Setup

### Local Development

```bash
# Start local Supabase instance
supabase start

# Apply migrations
supabase db push

# Stop local instance
supabase stop
```

### Migrations

Create a new migration:

```bash
supabase migration new migration_name
```

Apply migrations:

```bash
supabase db push
```

## Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests

```bash
pnpm test:e2e
```

### Coverage

```bash
pnpm test:coverage
```

## Code Quality

The project uses:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks

Pre-commit hooks automatically:
- Run ESLint and fix issues
- Format code with Prettier

## Environment Files

- `.env.example` - Template (committed)
- `.env.local` - Local development (git-ignored)
- `.env.staging` - Staging environment (git-ignored)
- `.env.production` - Production environment (git-ignored)

## Troubleshooting

### Supabase Connection Issues

1. Verify your project ID is correct in `supabase/config.toml`
2. Check environment variables are set correctly
3. Ensure Supabase project is active in dashboard

### Package Installation Issues

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript Errors

```bash
# Run type check
pnpm type-check

# Check specific package
pnpm --filter <package-name> type-check
```

## Next Steps

1. Set up Supabase database schema (see `Setup/SUPABASE_SETUP.md`)
2. Configure authentication (see `Setup/SUPABASE_SETUP.md`)
3. Deploy edge functions (see `Setup/EDGE_FUNCTIONS_SETUP.md`)
4. Set up CI/CD pipeline
5. Configure production environment

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://ai-sdk.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

Private - ACT 2.0

