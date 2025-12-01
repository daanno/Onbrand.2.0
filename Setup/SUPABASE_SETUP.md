# 🗄️ Actonbrand 2.0 — Supabase Setup

## Overview

Complete Supabase setup for Actonbrand 2.0 multi-brand monorepo architecture with staging and production environments, row-level security (RLS), and brand isolation.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Staging vs Production](#staging-vs-production)
4. [CLI Setup](#cli-setup)
5. [Database Schema](#database-schema)
6. [Row-Level Security (RLS)](#row-level-security-rls)
7. [Environment Variables](#environment-variables)
8. [Migrations](#migrations)
9. [Multi-Brand Architecture](#multi-brand-architecture)
10. [Auth Configuration](#auth-configuration)
11. [Storage Buckets](#storage-buckets)
12. [Edge Functions Integration](#edge-functions-integration)
13. [Local Development](#local-development)
14. [Deployment](#deployment)
15. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

- Supabase account (https://supabase.com)
- Two projects created:
  - **Staging**: For development and testing
  - **Production**: For live users
- Node.js 18+ and npm/pnpm
- PostgreSQL knowledge (basic)

---

## 📁 Project Structure

```
actonbrand-2025/
├── supabase/
│   ├── config.toml                    # Supabase CLI config
│   ├── migrations/                    # Database migrations
│   │   ├── 20250107_create_brand_users.sql
│   │   ├── 20250108_create_content_tables.sql
│   │   └── 20250109_enable_rls.sql
│   ├── functions/                     # Edge Functions (see EDGE_FUNCTIONS_SETUP.md)
│   └── seed.sql                       # Seed data for development
├── .env.local                         # Local dev environment
├── .env.staging                       # Staging environment
├── .env.production                    # Production environment (git-ignored)
└── docs/
    ├── SUPABASE_SETUP.md             # This file
    ├── EDGE_FUNCTIONS_SETUP.md
    └── MONOREPO_SUMMARY.md
```

---

## 🏗️ Staging vs Production

### Why Two Environments?

| Environment | Purpose | Usage |
|-------------|---------|-------|
| **Staging** | Testing, QA, demos | Safe for breaking changes, data can be reset |
| **Production** | Live users, real data | Stable, high availability, careful migrations |

### Key Differences

```typescript
// Staging
- Relaxed RLS policies for testing
- Email confirmation OFF (faster signups)
- Verbose logging enabled
- Test data seeded
- Lower rate limits OK

// Production
- Strict RLS policies
- Email confirmation ON
- Error logging only
- Real user data
- Rate limiting enforced
```

### Project Setup

1. **Create two projects in Supabase Dashboard:**
   - `actonbrand-staging`
   - `actonbrand-production`

2. **Note down project refs:**
   ```
   Staging:    https://xlakgtzjsjlswvgjicrs.supabase.co
   Production: https://abcdefghijklmnopqrst.supabase.co
   ```

3. **Get API keys for each:**
   - Dashboard → Settings → API
   - Copy: `anon` (public) and `service_role` (admin)

---

## 🛠️ CLI Setup

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Alternative (cross-platform)
npm install -g supabase

# Verify
supabase --version
```

### Login and Link

```bash
# Login (opens browser)
supabase login

# Link to staging
supabase link --project-ref xlakgtzjsjlswvgjicrs

# To switch to production later
supabase link --project-ref abcdefghijklmnopqrst
```

### Initialize Local Setup

```bash
# From repo root
cd /Users/zara/Desktop/act.onbrand.workflows/actonbrand-2025

# Init (if not already done)
supabase init

# Start local Supabase (Docker required)
supabase start

# Stop local instance
supabase stop
```

---

## 🗃️ Database Schema

### Core Tables

#### 1. Brands Table

```sql
-- Multi-brand support
CREATE TABLE public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#000000',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default brands
INSERT INTO public.brands (id, name, display_name, primary_color) VALUES
  ('act', 'act', 'ACT', '#2563eb'),
  ('globex', 'globex', 'Globex Corp', '#7c3aed');
```

#### 2. Brand Users Table

```sql
-- User-brand mapping with roles
CREATE TABLE public.brand_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'editor', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

-- Index for performance
CREATE INDEX idx_brand_users_user_id ON public.brand_users(user_id);
CREATE INDEX idx_brand_users_brand_id ON public.brand_users(brand_id);
```

#### 3. Content Tables (Example)

```sql
-- Brand-isolated content
CREATE TABLE public.content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for brand queries
CREATE INDEX idx_content_brand_id ON public.content(brand_id);
CREATE INDEX idx_content_user_id ON public.content(user_id);
```

#### 4. Triggers for Auto-Assignment

```sql
-- Auto-assign users to brands on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Get brand_id from user metadata
  INSERT INTO public.brand_users (user_id, brand_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'brand_id', 'act'), -- Default to 'act'
    'user'
  )
  ON CONFLICT (user_id, brand_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔒 Row-Level Security (RLS)

### Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

#### Brands (Public Read)

```sql
-- Anyone can read brands
CREATE POLICY "Brands are viewable by everyone"
  ON public.brands FOR SELECT
  USING (true);

-- Only service role can modify
CREATE POLICY "Brands are modifiable by service role only"
  ON public.brands FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

#### Brand Users (User Access)

```sql
-- Users can see their own brand memberships
CREATE POLICY "Users can view their own brand memberships"
  ON public.brand_users FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage users in their brand
CREATE POLICY "Brand admins can manage brand users"
  ON public.brand_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_users bu
      WHERE bu.user_id = auth.uid()
        AND bu.brand_id = brand_users.brand_id
        AND bu.role IN ('admin', 'owner')
    )
  );
```

#### Content (Brand Isolation)

```sql
-- Users can only see content from their brands
CREATE POLICY "Users can view content from their brands"
  ON public.content FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
    )
  );

-- Users can create content for their brands
CREATE POLICY "Users can create content for their brands"
  ON public.content FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own content
CREATE POLICY "Users can update their own content"
  ON public.content FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can delete content in their brand
CREATE POLICY "Admins can delete brand content"
  ON public.content FOR DELETE
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );
```

---

## 🔐 Environment Variables

### Local Development (`.env.local`)

```bash
# Supabase (local instance via supabase start)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...LOCAL_ANON_KEY

# Service role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...LOCAL_SERVICE_KEY

# Edge Functions
VITE_SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1
```

### Staging (`.env.staging`)

```bash
# Supabase Staging Project
VITE_SUPABASE_URL=https://xlakgtzjsjlswvgjicrs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...STAGING_ANON_KEY

# Service role (commit to private repo only, or use secrets manager)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...STAGING_SERVICE_KEY

# Edge Functions
VITE_SUPABASE_FUNCTIONS_URL=https://xlakgtzjsjlswvgjicrs.functions.supabase.co
```

### Production (`.env.production`)

```bash
# ⚠️ NEVER commit to git - use secrets manager (Vercel, AWS Secrets, etc.)
VITE_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...PRODUCTION_ANON_KEY

# Service role (store in secrets manager)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...PRODUCTION_SERVICE_KEY

# Edge Functions
VITE_SUPABASE_FUNCTIONS_URL=https://abcdefghijklmnopqrst.functions.supabase.co
```

### Monorepo Package Usage

```typescript
// packages/auth/src/auth-client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 📦 Migrations

### Creating Migrations

```bash
# Create a new migration
supabase migration new create_projects_table

# Edit the generated file in supabase/migrations/
```

### Example Migration

```sql
-- supabase/migrations/20250108_create_projects_table.sql

-- Create projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view projects from their brands"
  ON public.projects FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );
```

### Running Migrations

```bash
# Push to remote (staging or production)
supabase db push

# Or apply specific migration
supabase db push --include 20250108_create_projects_table.sql

# Rollback (be careful in production!)
supabase db reset
```

---

## 🏢 Multi-Brand Architecture

### How It Works

```
User Signs Up
    ↓
Signup includes brand_id in metadata
    ↓
Trigger: handle_new_user() creates brand_users record
    ↓
RLS policies filter all queries by user's brands
    ↓
User only sees/modifies data from their brand(s)
```

### Brand Assignment Flow

```typescript
// During signup
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      brand_id: 'act',  // From subdomain, invite link, or selection
      full_name: 'John Doe'
    }
  }
});

// Trigger automatically creates:
// INSERT INTO brand_users (user_id, brand_id, role) VALUES (user.id, 'act', 'user');
```

### Querying Brand Data

```typescript
// RLS automatically filters by brand
const { data: content } = await supabase
  .from('content')
  .select('*');
// Returns only content from user's brand(s)

// Explicitly filter (optional, RLS already does this)
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('brand_id', 'act');
```

---

## 🔑 Auth Configuration

### Dashboard Settings

1. **Navigate to:** Dashboard → Auth → Providers
2. **Enable Email Provider**
3. **Configure:**
   - ✅ Enable email signup
   - ⚠️ **Staging**: Confirm email OFF (faster testing)
   - ✅ **Production**: Confirm email ON (security)

### Redirect URLs

```
Allowed redirect URLs (staging):
- http://localhost:3000
- http://localhost:5173
- https://staging.actonbrand.com

Allowed redirect URLs (production):
- https://app.actonbrand.com
- https://act.actonbrand.com
- https://globex.actonbrand.com
```

### JWT Settings

```
JWT expiry: 3600 (1 hour)
Refresh token expiry: 604800 (7 days)
```

---

## 📦 Storage Buckets

### Create Buckets

```sql
-- Via SQL Editor or Dashboard → Storage
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('brand-assets', 'brand-assets', true),
  ('user-uploads', 'user-uploads', false);
```

### Storage RLS Policies

```sql
-- Users can upload to their brand's folder
CREATE POLICY "Users can upload to their brand folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );

-- Users can read their brand's assets
CREATE POLICY "Users can view their brand assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT brand_id FROM public.brand_users WHERE user_id = auth.uid()
    )
  );
```

---

## 🔌 Edge Functions Integration

### Accessing Database from Edge Functions

```typescript
// supabase/functions/my-function/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Admin access, bypasses RLS
);

// Or respect RLS by forwarding user JWT
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! }
    }
  }
);
```

---

## 💻 Local Development

### Start Local Supabase

```bash
# Start (requires Docker)
supabase start

# Output shows:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stop
supabase stop

# Reset database
supabase db reset
```

### Apply Migrations Locally

```bash
# Push migrations to local DB
supabase db push

# Or reset and reapply all
supabase db reset
```

### Seed Local Data

```sql
-- supabase/seed.sql
INSERT INTO public.brands (id, name, display_name) VALUES
  ('test-brand', 'test-brand', 'Test Brand');

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@example.com');

INSERT INTO public.brand_users (user_id, brand_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test-brand', 'admin');
```

```bash
# Apply seed
supabase db reset --seed seed.sql
```

---

## 🚀 Deployment

### Deploy Migrations (Staging)

```bash
# Link to staging
supabase link --project-ref xlakgtzjsjlswvgjicrs

# Push migrations
supabase db push

# Deploy Edge Functions (see EDGE_FUNCTIONS_SETUP.md)
supabase functions deploy
```

### Deploy to Production

```bash
# Switch to production
supabase link --project-ref abcdefghijklmnopqrst

# ⚠️ BACKUP FIRST
# Dashboard → Database → Backups → Create backup

# Push migrations
supabase db push

# Deploy functions
supabase functions deploy
```

### Zero-Downtime Migration Strategy

1. **Add new columns/tables** (non-breaking)
2. **Deploy app code** that uses old + new schema
3. **Backfill data** if needed
4. **Deploy app code** that uses new schema only
5. **Remove old columns/tables** (if safe)

---

## 🧯 Troubleshooting

### Issue: RLS blocks all queries

**Symptom:** `{ data: [], error: null }` for everything

**Fix:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable RLS (staging only!)
ALTER TABLE public.content DISABLE ROW LEVEL SECURITY;
```

### Issue: Migration fails

**Symptom:** `ERROR: relation "xyz" already exists`

**Fix:**
```bash
# Check migration status
supabase db diff

# Reset local DB
supabase db reset

# Or fix migration manually in Dashboard → SQL Editor
```

### Issue: User not assigned to brand

**Symptom:** User can't see any data after signup

**Fix:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Manually assign user
INSERT INTO public.brand_users (user_id, brand_id, role)
VALUES ('user-uuid-here', 'act', 'user');
```

### Issue: Environment variables not loading

**Symptom:** `undefined` for VITE_SUPABASE_URL

**Fix:**
```bash
# Check .env file exists
ls -la .env.local

# Restart dev server
npm run dev

# Or explicitly load
npm run dev -- --mode staging  # loads .env.staging
```

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **CLI Reference:** https://supabase.com/docs/reference/cli
- **Migrations Guide:** https://supabase.com/docs/guides/cli/local-development
- **Multi-tenancy Patterns:** https://supabase.com/docs/guides/auth/managing-user-data

---

## ✅ Setup Checklist

### Initial Setup
- [ ] Install Supabase CLI
- [ ] Create staging and production projects
- [ ] Save API keys to `.env.staging` and `.env.production`
- [ ] Link CLI to staging project
- [ ] Initialize local Supabase

### Database Setup
- [ ] Create `brands` table
- [ ] Create `brand_users` table
- [ ] Create content tables
- [ ] Enable RLS on all tables
- [ ] Create RLS policies
- [ ] Create `handle_new_user()` trigger

### Configuration
- [ ] Configure auth providers
- [ ] Set redirect URLs
- [ ] Configure email templates (production)
- [ ] Create storage buckets
- [ ] Set storage RLS policies

### Development
- [ ] Test local Supabase setup
- [ ] Test signup flow
- [ ] Test brand assignment
- [ ] Test RLS isolation
- [ ] Seed local data

### Deployment
- [ ] Push migrations to staging
- [ ] Test on staging
- [ ] Backup production database
- [ ] Push migrations to production
- [ ] Deploy Edge Functions
- [ ] Monitor logs

---

**Status:** Production-ready multi-brand Supabase architecture with RLS, staging/production separation, and monorepo integration.

**Created:** November 27, 2025  
**Version:** 2.0

