# Environment Setup Instructions

## Quick Fix for Supabase Configuration Error

You're seeing this error because the `.env.local` file is missing. Follow these steps to fix it:

### Step 1: Create .env.local file

In the `brands/act-frontend` directory, create a new file called `.env.local`:

```bash
cd brands/act-frontend
cp .env.example .env.local
```

Or create it manually:

```bash
touch brands/act-frontend/.env.local
```

### Step 2: Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Navigate to: **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### Step 3: Add Configuration to .env.local

Open `brands/act-frontend/.env.local` and add:

```bash
# Environment Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key_here

# Supabase Admin (Service Role) Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key_here

# Supabase Functions URL
SUPABASE_FUNCTIONS_URL=https://your-project-ref.functions.supabase.co
```

**Replace:**
- `your-project-ref` with your actual Supabase project reference
- `your_anon_key_here` with your actual anon key
- `your_service_role_key_here` with your actual service role key

### Step 4: Restart Your Development Server

Stop the current dev server (Ctrl+C) and restart it:

```bash
pnpm dev
```

The error should now be resolved!

---

## Alternative: Using Local Supabase

If you want to develop completely locally without a cloud instance:

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### 2. Start Local Supabase

```bash
cd /Users/zara/Desktop/chatbot/Onbrand.2.0
supabase start
```

This will output local credentials that look like:

```
API URL: http://localhost:54321
Anon key: eyJhbGc...
Service role key: eyJhbGc...
```

### 3. Use Local Credentials

Update your `.env.local` with the local values:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...(from supabase start output)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...(from supabase start output)
SUPABASE_FUNCTIONS_URL=http://localhost:54321/functions/v1
```

---

## Troubleshooting

### Still seeing the error?

1. **Check file location:** Make sure `.env.local` is in `brands/act-frontend/` directory
2. **Verify variable names:** Must start with `NEXT_PUBLIC_` for client-side access
3. **Restart dev server:** Changes to `.env` files require a restart
4. **Check for typos:** Variable names are case-sensitive

### Need help finding your Supabase credentials?

```bash
# If using local Supabase, check status
supabase status

# This will show all your local credentials
```

---

## Next Steps

Once your environment is configured:

1. ✅ Test the connection by visiting http://localhost:3000
2. ✅ Try signing up or logging in
3. ✅ Check the Setup documentation in `/Setup` folder for more configuration options

For more detailed information, see:
- `/Setup/ENVIRONMENT_SETUP.md` - Complete environment guide
- `/Setup/SUPABASE_SETUP.md` - Supabase configuration details


