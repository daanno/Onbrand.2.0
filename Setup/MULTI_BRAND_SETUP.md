# Multi-Brand Setup Guide

## Overview

The ACT 2.0 platform supports multiple brands using a **subdomain-based** architecture. Each brand gets:
- Its own subdomain (e.g., `act.yourdomain.com`, `acme.yourdomain.com`)
- Its own frontend deployment
- Automatic brand detection and assignment
- Shared backend database with brand isolation

---

## Architecture

### **Subdomain-Based Brand Detection**

```
act.yourdomain.com      → ACT brand (act-frontend)
acme.yourdomain.com     → Acme brand (acme-frontend)
techcorp.yourdomain.com → TechCorp brand (techcorp-frontend)
localhost:3000          → ACT brand (default for development)
```

### **How It Works**

1. **User visits brand subdomain** (e.g., `acme.yourdomain.com`)
2. **Brand detection utility** extracts brand from hostname
3. **User signs up/logs in** → Brand ID passed to Supabase
4. **Database trigger** assigns user to correct brand
5. **User accesses brand-specific data** via RLS policies

---

## Current Brands

### **ACT (Default)**
- **Brand ID:** `act`
- **Subdomain:** `act.yourdomain.com`
- **Frontend:** `brands/act-frontend/`
- **Colors:** Black (#000000), White (#FFFFFF), Accent (#FF6B35)

### **Acme (Configured, Not Deployed)**
- **Brand ID:** `acme`
- **Subdomain:** `acme.yourdomain.com`
- **Frontend:** To be created
- **Colors:** Blue (#1E40AF), White (#FFFFFF), Accent (#F59E0B)

---

## Adding a New Brand

### **Step 1: Add Brand to Database**

```sql
-- Add new brand to the brands table
INSERT INTO public.brands (id, name, created_at, updated_at)
VALUES ('newbrand', 'NewBrand Inc', NOW(), NOW());

-- The trigger will automatically create a quota for this brand
```

### **Step 2: Update Brand Configuration**

Edit `brands/act-frontend/lib/brand.ts` (or copy to new frontend):

```typescript
const BRAND_CONFIGS: Record<string, BrandConfig> = {
  // ... existing brands ...
  
  newbrand: {
    id: 'newbrand',
    name: 'newbrand',
    displayName: 'NewBrand Inc',
    domain: 'newbrand',
    colors: {
      primary: '#YOUR_PRIMARY_COLOR',
      secondary: '#YOUR_SECONDARY_COLOR',
      accent: '#YOUR_ACCENT_COLOR',
    },
    logo: '/images/newbrand-logo.png',      // Optional
    favicon: '/images/newbrand-favicon.ico', // Optional
  },
};
```

### **Step 3: Create New Frontend (Optional)**

You can either:

#### **Option A: Share the ACT Frontend**
- Use the existing `act-frontend` for all brands
- Deploy to multiple subdomains
- Brand detection will work automatically

#### **Option B: Create Brand-Specific Frontend**

```bash
# Copy ACT frontend as template
cp -r brands/act-frontend brands/newbrand-frontend

# Update package.json
cd brands/newbrand-frontend
# Edit package.json: change name to "newbrand-frontend"

# Update brand configuration to default to your brand
# Edit .env.local:
NEXT_PUBLIC_BRAND_ID=newbrand
```

### **Step 4: Configure DNS & Deployment**

#### **DNS Setup**
Add a CNAME record:
```
newbrand.yourdomain.com → your-deployment-url
```

#### **Deployment Options**

**Vercel:**
```bash
cd brands/newbrand-frontend
vercel --prod

# Set custom domain in Vercel dashboard:
# newbrand.yourdomain.com
```

**Netlify:**
```bash
cd brands/newbrand-frontend
netlify deploy --prod

# Set custom domain in Netlify dashboard
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY brands/newbrand-frontend ./
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

### **Step 5: Update Supabase OAuth Settings**

Go to: Supabase Dashboard → Authentication → URL Configuration

**Add redirect URLs:**
```
https://newbrand.yourdomain.com/**
https://newbrand.yourdomain.com/auth/callback
```

---

## Development Workflow

### **Testing Brand Detection Locally**

#### **Method 1: Environment Variable Override**
```bash
# In brands/act-frontend/.env.local
NEXT_PUBLIC_BRAND_ID=acme

# Now localhost will behave as Acme brand
pnpm dev
```

#### **Method 2: Local Subdomain**

Edit `/etc/hosts`:
```
127.0.0.1 act.localhost
127.0.0.1 acme.localhost
```

Then visit:
- `http://act.localhost:3000` → ACT brand
- `http://acme.localhost:3000` → Acme brand

#### **Method 3: Use Different Ports**

```bash
# Terminal 1: ACT frontend
cd brands/act-frontend
NEXT_PUBLIC_BRAND_ID=act pnpm dev -p 3000

# Terminal 2: Acme frontend
cd brands/acme-frontend
NEXT_PUBLIC_BRAND_ID=acme pnpm dev -p 3001
```

---

## Brand Isolation

### **Database Level**

All tables with brand data include RLS policies:

```sql
-- Example: brand_users table
CREATE POLICY "Users can only see their own brand users"
  ON public.brand_users
  FOR SELECT
  USING (brand_id IN (
    SELECT brand_id 
    FROM public.brand_users 
    WHERE user_id = auth.uid()
  ));
```

### **Application Level**

The frontend automatically detects and uses the correct brand:

```typescript
import { detectBrandId } from '@/lib/brand';

const brandId = detectBrandId(); // Returns 'act', 'acme', etc.

// Use in API calls
const users = await supabase
  .from('brand_users')
  .select('*')
  .eq('brand_id', brandId);
```

---

## Brand-Specific Customization

### **Colors & Styling**

Use brand config in components:

```typescript
import { getBrandConfig } from '@/lib/brand';

export function BrandedButton() {
  const brand = getBrandConfig();
  
  return (
    <button
      style={{
        backgroundColor: brand.colors.primary,
        color: brand.colors.secondary,
      }}
    >
      Click me
    </button>
  );
}
```

### **Logos & Assets**

Place brand-specific assets in:
```
public/
├── images/
│   ├── act-logo.png
│   ├── acme-logo.png
│   └── newbrand-logo.png
```

Reference in brand config:
```typescript
logo: '/images/newbrand-logo.png'
```

---

## Deployment Strategies

### **Strategy 1: Multi-Deployment (Recommended)**

- **One deployment per brand**
- **Independent scaling**
- **Brand-specific customizations**
- **Easier to manage**

```
act.yourdomain.com      → Vercel Project 1
acme.yourdomain.com     → Vercel Project 2
techcorp.yourdomain.com → Vercel Project 3
```

### **Strategy 2: Single Deployment, Multiple Domains**

- **One deployment serves all brands**
- **Domain-based routing**
- **Shared codebase**
- **Lower infrastructure cost**

```
All domains → Single Vercel Project
            → Brand detection at runtime
```

---

## Testing Checklist

### **For Each New Brand:**

- [ ] Brand added to database (`brands` table)
- [ ] Brand config added to `lib/brand.ts`
- [ ] Frontend deployed to brand subdomain
- [ ] DNS CNAME configured
- [ ] Supabase redirect URLs updated
- [ ] Test signup flow:
  - [ ] Email/password registration
  - [ ] GitHub OAuth
  - [ ] User assigned to correct brand
  - [ ] User can access dashboard
- [ ] Test brand isolation:
  - [ ] User can only see their brand's data
  - [ ] User cannot access other brands' data
- [ ] Test quota system:
  - [ ] Brand quota created automatically
  - [ ] Token tracking works correctly

---

## Troubleshooting

### **Brand Detection Returns 'act' Instead of My Brand**

**Check:**
1. Hostname is correct (not localhost)
2. Brand exists in `BRAND_CONFIGS`
3. `NEXT_PUBLIC_BRAND_ID` is not set (unless intentional)

### **User Assigned to Wrong Brand**

**Check:**
1. `brand_id` is passed in OAuth `queryParams`
2. `brand_id` is in `user_meta_data` for email signups
3. Database trigger is working (`handle_new_user`)

### **OAuth Callback Fails**

**Check:**
1. Redirect URL is in Supabase allowed list
2. Callback URL matches: `https://yourbrand.yourdomain.com/auth/callback`
3. No typos in subdomain

---

## Security Considerations

### **Brand Isolation**

- ✅ RLS policies enforce brand boundaries
- ✅ Users can only access their brand's data
- ✅ API routes should check brand membership
- ✅ Admin panel requires Company Admin role

### **Cross-Brand Access**

Only "Company Admin" from ACT brand can:
- View all brands
- Manage quotas across brands
- Access system-wide settings

Configured via `canManageBrand()` permission.

---

## Migration Guide

### **From Single Brand to Multi-Brand**

If you have existing users in ACT brand:

1. **No action needed!** Existing users remain in ACT
2. **New brands** can be added without affecting ACT
3. **Users stay isolated** to their brands
4. **Quotas are separate** per brand

### **Moving Users Between Brands**

```sql
-- Move user to different brand
UPDATE public.brand_users
SET brand_id = 'newbrand'
WHERE user_id = 'user-uuid-here';
```

⚠️ **Note:** This doesn't migrate their data! Only reassigns brand access.

---

## Summary

### **What We Built**

✅ **Brand detection utility** - Automatically detects brand from hostname  
✅ **Multi-brand auth flow** - Users assigned to correct brand on signup  
✅ **Database isolation** - RLS policies enforce brand boundaries  
✅ **Flexible deployment** - One or many frontends  
✅ **Easy to extend** - Add new brands in minutes  

### **Current State**

- **ACT brand**: ✅ Fully working
- **Acme brand**: ✅ Configured in code, ready for deployment
- **Future brands**: ✅ 5-minute setup

### **Next Steps**

1. Deploy ACT frontend to production
2. Test with real subdomain
3. Add Acme frontend when ready
4. Scale to more brands as needed

---

**You now have a production-ready multi-brand platform!** 🎉
