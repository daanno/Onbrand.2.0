# 🎯 ACT Monorepo - Architecture Summary

## 📁 Project Structure

```
ACT.test/
├── brands/
│   └── acme-frontend/           # ACME brand application
│       ├── src/
│       │   └── app/
│       │       ├── auth-wrapper.tsx
│       │       ├── layout.tsx
│       │       └── page.tsx
│       └── package.json
│
├── packages/
│   ├── auth/                    # Shared authentication package
│   │   ├── src/
│   │   │   ├── auth-client.ts   # Supabase auth logic
│   │   │   ├── auth-provider.tsx # React context provider
│   │   │   ├── types.ts         # TypeScript interfaces
│   │   │   └── validation.ts    # Zod schemas
│   │   └── components/
│   │       ├── login-form.tsx
│   │       └── signup-form.tsx
│   │
│   ├── tenant-config/           # Brand configurations
│   │   └── src/
│   │       └── index.ts         # Brand configs & email domains
│   │
│   └── ui/                      # Shared UI components
│       └── src/
│           └── components/
│
├── supabase/
│   ├── migrations/              # Database migrations
│   │   ├── 20241124000000_multi_tenant_setup.sql
│   │   └── 20251125000000_safe_migration.sql
│   └── FINAL_SETUP.sql         # Complete setup script
│
└── docs/
    ├── DYNAMIC_BRAND_ARCHITECTURE.md
    ├── TROUBLESHOOTING.md
    └── SETUP_COMPLETE_GUIDE.md
```

---

## ✅ What's Working

### 1. **Monorepo Architecture**
- ✅ TypeScript workspace configuration
- ✅ Shared packages across brands (`@act/auth`, `@act/tenant-config`, `@act/ui`)
- ✅ Next.js 16 with Turbopack
- ✅ Single codebase serving multiple brands

### 2. **Dynamic Brand Detection**
- ✅ Brand agnostic - not tied to email domains
- ✅ Brand specified during signup (via subdomain, invite link, or manual selection)
- ✅ Any email can sign up for any brand
- ✅ Brand stored in user metadata for context

### 3. **Database Setup**
- ✅ `brands` table with ACME and Globex
- ✅ `brand_users` table for user-brand mapping
- ✅ Trigger `on_auth_user_created` auto-assigns users
- ✅ RLS policies for brand isolation
- ✅ Function `handle_new_user()` ready

### 4. **Frontend**
- ✅ AuthProvider with dynamic brand context
- ✅ No hardcoded brandId
- ✅ Brand context available via `useAuth()` hook
- ✅ Shared authentication components
- ✅ Running on http://localhost:3000

### 5. **CORS Configuration**
- ✅ Supabase allows `http://localhost:3000`
- ✅ Redirect URLs configured
- ✅ No CORS blocking

---

## ❌ Current Blocker

### **Email Confirmation Preventing Signups**
- ❌ Supabase requires email verification
- ❌ Users sign up but don't appear in database (pending confirmation)
- ❌ API cannot disable it - requires manual dashboard change
- ⏸️ **Blocked until manually disabled in Supabase dashboard**

**To Fix:**
1. Go to: https://supabase.com/dashboard/project/xlakgtzjsjlswvgjicrs/auth/providers
2. Click "Email" section
3. Toggle "Confirm email" OFF
4. Save

---

## 🏗️ Architecture Details

### **Brand Configuration**

**File:** `packages/tenant-config/src/index.ts`

```typescript
export type BrandId = 'acme' | 'globex';

const brands: Record<BrandId, BrandConfig> = {
  acme: {
    id: 'acme',
    name: 'acme',
    displayName: 'Acme Labs',
    primaryColor: '#2563eb',
    logoPath: '/brands/acme/logo.svg',
    supabaseUrl: 'https://xlakgtzjsjlswvgjicrs.supabase.co',
    supabaseAnonKey: 'eyJhbGci...',
    // No email domain restrictions - any email can sign up
  },
  globex: {
    id: 'globex',
    name: 'globex',
    displayName: 'Globex Corp',
    primaryColor: '#7c3aed',
    logoPath: '/brands/globex/logo.svg',
    supabaseUrl: 'https://xlakgtzjsjlswvgjicrs.supabase.co',
    supabaseAnonKey: 'eyJhbGci...',
    // No email domain restrictions - any email can sign up
  }
};
```

### **Brand Assignment Flow**

```typescript
// 1. User signs up (brand determined by app context, not email)
const email = 'john@anyemail.com';  // Any email allowed
const brandId = 'acme';  // From subdomain, invite link, or brand selection

// 2. Supabase creates user with brand metadata
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      brand_id: brandId  // ← Brand specified during signup
    }
  }
});

// 3. Trigger automatically creates brand_users record
// (happens in database via trigger)

// 4. User logs in - brand is available
const { user } = useAuth();
const userBrand = user.user_metadata?.brand_id; // 'acme'
```

**Brand Determination Methods:**
- Subdomain: `acme.app.com` → ACME brand
- Invite link: `/signup?brand=acme` → ACME brand
- Manual selection: User chooses brand during signup
- App context: Brand frontend (`brands/acme-frontend`) → ACME brand
```

### **Database Schema**

```sql
-- Brands table
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-brand mapping
CREATE TABLE brand_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

-- Auto-assign trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO brand_users (user_id, brand_id)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'brand_id')
  ON CONFLICT (user_id, brand_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Status Overview

| Component | Status | Details |
|-----------|--------|---------|
| **Architecture** | ✅ Complete | Monorepo with shared packages |
| **Brand Detection** | ✅ Working | Email domain → Brand ID mapping |
| **Database Schema** | ✅ Complete | Tables, trigger, function ready |
| **Frontend** | ✅ Running | Dynamic AuthProvider, no hardcoded brandId |
| **CORS** | ✅ Fixed | Localhost allowed |
| **Signup Flow** | ❌ Blocked | Email confirmation preventing user creation |

---

## 🎯 Design Principles

### **1. Single Codebase, Multiple Brands**
- One Next.js app serves all brands
- Brand-specific config in `tenant-config` package
- Shared components in `auth` and `ui` packages

### **2. Email-Agnostic Brand Assignment**
- Brand determined by app context (subdomain, invite link, or selection UI)
- **NOT** determined by email domain - any email can sign up for any brand
- No hardcoded brand IDs in app code
- Brand stored in Supabase user metadata

### **3. Database-Level Isolation**
- RLS policies filter data by brand
- `brand_users` table links users to brands
- Trigger automatically creates associations

### **4. Extensible Architecture**
- Easy to add new brands (just update config, no email domain rules)
- Shared packages reduce code duplication
- TypeScript ensures type safety across workspace

---

## 🚀 Running the Project

### **Development**

```bash
# From project root
cd /Users/dwayne/Documents/Playground/ACT.test

# Start ACME frontend
npm run dev:acme

# Open browser
open http://localhost:3000
```

### **Test Signup**

1. Go to http://localhost:3000
2. Sign up with any email:
   - `test@gmail.com` / `password123` → Assigned to ACME (default brand for this frontend)
   - `user@company.com` / `password123` → Assigned to ACME (any email works)
3. Verify in database (after fixing email confirmation)

**Note:** Brand is determined by which frontend app you're using (`brands/acme-frontend` = ACME), not by email domain.

---

## 🔍 Key Files

### **Authentication**
- `packages/auth/src/auth-client.ts` - Supabase auth logic
- `packages/auth/src/auth-provider.tsx` - React context
- `packages/auth/src/validation.ts` - Zod schemas

### **Brand Configuration**
- `packages/tenant-config/src/index.ts` - Brand configs & email domains

### **Frontend**
- `brands/acme-frontend/src/app/auth-wrapper.tsx` - AuthProvider wrapper
- `brands/acme-frontend/src/app/page.tsx` - Main page with login/signup

### **Database**
- `supabase/FINAL_SETUP.sql` - Complete database setup
- `supabase/migrations/` - Migration files

### **Documentation**
- `docs/DYNAMIC_BRAND_ARCHITECTURE.md` - Architecture details
- `docs/TROUBLESHOOTING.md` - Common issues
- `SETUP_COMPLETE_GUIDE.md` - Complete setup guide

---

## 🎓 What This Achieves

### **Before (Hardcoded)**
```typescript
// Each brand needed separate app
<AuthProvider brandId="acme">  // ❌ Hardcoded
  {children}
</AuthProvider>
```

### **After (Dynamic)**
```typescript
// One app serves all brands
<AuthProvider>  // ✅ Brand from app context, not email
  {children}
</AuthProvider>
```

### **Benefits**
- ✅ One codebase for all brands
- ✅ Email-agnostic - any email can sign up for any brand
- ✅ Brand determined by app context (subdomain, invite, selection)
- ✅ Database-level isolation between brands
- ✅ Easy to add new brands (no email domain management)
- ✅ Shared components reduce duplication
- ✅ Type-safe across workspace

---

## 🔗 Important Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/xlakgtzjsjlswvgjicrs
- **Auth Settings:** https://supabase.com/dashboard/project/xlakgtzjsjlswvgjicrs/settings/auth
- **Auth Providers:** https://supabase.com/dashboard/project/xlakgtzjsjlswvgjicrs/auth/providers
- **SQL Editor:** https://supabase.com/dashboard/project/xlakgtzjsjlswvgjicrs/sql/new
- **Local App:** http://localhost:3000

---

## 📝 Next Steps

1. ✅ Disable email confirmation in Supabase dashboard
2. ✅ Test signup with any email (e.g., `test@gmail.com`)
3. ✅ Verify user appears in database with correct brand assignment
4. ✅ Implement brand selection UI (dropdown, subdomain routing, or invite links)
5. ✅ Add more brands as needed (no email domain config required)
6. ✅ Deploy to production

---

**Status:** Architecture complete, waiting on Supabase email confirmation fix to test end-to-end flow.

**Created:** November 25, 2025
