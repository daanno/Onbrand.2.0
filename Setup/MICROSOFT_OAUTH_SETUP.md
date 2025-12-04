# Microsoft OAuth Setup Guide

Complete guide to setting up Microsoft (Azure AD) OAuth for work email authentication.

## 🎯 Why Microsoft OAuth?

**Perfect for B2B SaaS platforms:**
- ✅ Users sign up with work emails (company.com, not gmail.com)
- ✅ Automatic brand detection from email domain
- ✅ Enterprise-ready authentication
- ✅ Single Sign-On (SSO) compatible
- ✅ Supports Microsoft 365 / Office 365 accounts

**Example Flow:**
```
User: john@acmecompany.com
→ Signs in with Microsoft
→ Brand detected: "acmecompany"
→ Auto-assigned to Acme Company brand
→ Joins team workspace automatically
```

---

## 📋 Prerequisites

- Azure account (free tier works)
- Supabase project
- Your app URL (e.g., `http://localhost:3000` for dev)

---

## 🚀 Setup Steps

### Step 1: Create Azure App Registration

1. **Go to Azure Portal:**
   - Visit: https://portal.azure.com
   - Sign in with your Microsoft account

2. **Navigate to App Registrations:**
   ```
   Azure Active Directory → App registrations → New registration
   ```

3. **Register Application:**
   ```
   Name: Onbrand Platform (or your app name)
   Supported account types: Accounts in any organizational directory (Any Azure AD directory - Multitenant)
   Redirect URI: 
     - Platform: Web
     - URL: https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```

   **Example:**
   ```
   Redirect URI: https://pyvobennsmzyvtaceopn.supabase.co/auth/v1/callback
   ```

4. **Click "Register"**

---

### Step 2: Configure Application

1. **Copy Application (client) ID:**
   ```
   Overview → Application (client) ID
   Example: 12345678-1234-1234-1234-123456789012
   ```
   **Save this - you'll need it for Supabase!**

2. **Copy Directory (tenant) ID:**
   ```
   Overview → Directory (tenant) ID
   Example: 87654321-4321-4321-4321-210987654321
   ```
   **Save this too!**

3. **Create Client Secret:**
   ```
   Certificates & secrets → New client secret
   Description: Supabase OAuth
   Expires: 24 months (recommended)
   → Add
   ```
   
   **Copy the secret VALUE immediately!** (You can't see it again)
   ```
   Example: abc123~XYZ789.secretValue
   ```

---

### Step 3: Configure API Permissions

1. **Add Permissions:**
   ```
   API permissions → Add a permission → Microsoft Graph → Delegated permissions
   ```

2. **Select these permissions:**
   - ✅ `email`
   - ✅ `openid`
   - ✅ `profile`
   - ✅ `User.Read`

3. **Grant admin consent** (if you're admin):
   ```
   Click "Grant admin consent for [Your Organization]"
   ```

---

### Step 4: Configure Supabase

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/auth/providers
   ```

2. **Enable Azure (Microsoft) Provider:**
   ```
   Authentication → Providers → Azure
   → Enable Azure
   ```

3. **Add Azure Credentials:**
   ```
   Azure Client ID: [Application (client) ID from Step 2]
   Azure Secret: [Client secret VALUE from Step 2]
   Azure Tenant ID: [Directory (tenant) ID from Step 2]
   ```

4. **Configure Redirect URL:**
   ```
   Redirect URL (already set): 
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

5. **Save Configuration**

---

### Step 5: Test Authentication

1. **Start your dev server:**
   ```bash
   cd brands/act-frontend
   pnpm dev
   ```

2. **Go to signup page:**
   ```
   http://localhost:3000/signup
   ```

3. **Click "Continue with Microsoft"**

4. **Sign in with work email:**
   ```
   Example: john@acmecompany.com
   ```

5. **Verify brand assignment:**
   - Check Supabase dashboard
   - `brand_users` table should show:
     ```
     user_id: [user-uuid]
     brand_id: "acmecompany"
     role: "owner" (if first user from domain)
     ```

---

## 🔧 Environment Variables

No additional environment variables needed! Supabase handles OAuth configuration.

**Existing variables (already set):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://pyvobennsmzyvtaceopn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎨 Frontend Implementation

### Signup Page

```typescript
// brands/act-frontend/app/signup/page.tsx

const handleMicrosoftSignUp = async () => {
  const brandId = detectBrandId();
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: getBrandCallbackUrl(),
      scopes: 'email openid profile',
      queryParams: {
        brand_id: brandId,
      },
    },
  });
};
```

### Login Page

```typescript
// brands/act-frontend/app/login/page.tsx

const handleMicrosoftSignIn = async () => {
  const brandId = detectBrandId();
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: getBrandCallbackUrl(),
      scopes: 'email openid profile',
      queryParams: {
        brand_id: brandId,
      },
    },
  });
};
```

---

## 🔐 Security Features

### Multi-Tenant Support

**Azure supports multiple organizations:**
```
Account types: Multitenant
→ Users from ANY organization can sign in
→ Each organization gets own brand automatically
```

### Brand Detection

**From work email:**
```
john@acmecompany.com → Brand: "acmecompany"
jane@techstartup.io → Brand: "techstartup"
bob@consulting.co.uk → Brand: "consulting"
```

### Public Email Handling

**Personal emails default to "act" brand:**
```
user@gmail.com → Brand: "act" (testing)
user@yahoo.com → Brand: "act" (testing)
user@hotmail.com → Brand: "act" (testing)
```

---

## 🧪 Testing Checklist

### Test Signup Flow

- [ ] Click "Continue with Microsoft"
- [ ] Redirected to Microsoft login
- [ ] Sign in with work email
- [ ] Redirected back to app
- [ ] User created in `auth.users`
- [ ] Brand created in `brands` table
- [ ] User assigned in `brand_users` table
- [ ] First user has role "owner"

### Test Login Flow

- [ ] Existing user clicks "Continue with Microsoft"
- [ ] Redirected to Microsoft
- [ ] Auto-signed in (if already logged into Microsoft)
- [ ] Redirected back to app
- [ ] User logged in successfully

### Test Brand Isolation

- [ ] Sign up with `user1@company1.com`
- [ ] Sign up with `user2@company2.com`
- [ ] Verify separate brands created
- [ ] Verify data isolation (each sees only their brand)

---

## 🐛 Troubleshooting

### Error: "Redirect URI mismatch"

**Problem:** Azure redirect URI doesn't match Supabase callback URL

**Solution:**
```
1. Go to Azure App Registration
2. Authentication → Redirect URIs
3. Add: https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
4. Save
```

### Error: "AADSTS50011: Reply URL mismatch"

**Problem:** Same as above

**Solution:** Ensure redirect URI is EXACTLY:
```
https://pyvobennsmzyvtaceopn.supabase.co/auth/v1/callback
```
(No trailing slash, exact URL)

### Error: "User not assigned to brand"

**Problem:** Database trigger not firing

**Solution:**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Re-run migration if needed
-- supabase/migrations/20251202170000_update_brand_creation_with_public_domains.sql
```

### Error: "Invalid client secret"

**Problem:** Client secret expired or incorrect

**Solution:**
```
1. Go to Azure App Registration
2. Certificates & secrets
3. Create new client secret
4. Update in Supabase dashboard
```

---

## 📊 User Flow Diagram

```
┌─────────────────────────────────────────────────┐
│  User clicks "Continue with Microsoft"          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Redirected to Microsoft login                  │
│  (login.microsoftonline.com)                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  User signs in with work email                  │
│  john@acmecompany.com                           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Microsoft returns to Supabase callback         │
│  https://[project].supabase.co/auth/v1/callback │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Supabase creates user in auth.users            │
│  email: john@acmecompany.com                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Database trigger fires                         │
│  handle_new_user_with_auto_brand()              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Extract domain: acmecompany.com                │
│  Create brand: "acmecompany"                    │
│  Assign user: role = "owner" (first user)       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  User redirected back to app                    │
│  Logged in with brand context                   │
└─────────────────────────────────────────────────┘
```

---

## ✅ Summary

**Microsoft OAuth Setup:**

1. ✅ Create Azure App Registration
2. ✅ Configure redirect URI
3. ✅ Get client ID, secret, tenant ID
4. ✅ Add API permissions
5. ✅ Configure in Supabase
6. ✅ Test authentication flow

**Benefits:**
- ✅ Work email authentication
- ✅ Automatic brand detection
- ✅ Enterprise-ready
- ✅ Multi-tenant support
- ✅ SSO compatible

**Result:**
- Users sign up with work emails
- Brands auto-created from domains
- Complete data isolation
- Professional authentication

**Your platform is now enterprise-ready!** 🚀
