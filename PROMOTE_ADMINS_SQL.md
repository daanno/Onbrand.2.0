# Promote dwayne@act.agency and danijel@act.agency to Company Admin

## Instructions

1. Go to: **https://supabase.com/dashboard/project/pyvobennsmzyvtaceopn/sql/new**
2. Copy and paste the SQL below
3. Click **Run** or press `Cmd+Enter`

---

## SQL to Execute

```sql
-- Promote dwayne@act.agency and danijel@act.agency to Company Admin

DO $$
DECLARE
  v_dwayne_id UUID;
  v_danijel_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO v_dwayne_id FROM auth.users WHERE email = 'dwayne@act.agency';
  SELECT id INTO v_danijel_id FROM auth.users WHERE email = 'danijel@act.agency';

  -- Promote dwayne@act.agency
  IF v_dwayne_id IS NOT NULL THEN
    -- Check if user exists in brand_users
    IF EXISTS (SELECT 1 FROM public.brand_users WHERE user_id = v_dwayne_id AND brand_id = 'act') THEN
      -- Update existing record
      UPDATE public.brand_users
      SET role = 'company_admin', updated_at = NOW()
      WHERE user_id = v_dwayne_id AND brand_id = 'act';
      RAISE NOTICE 'Updated dwayne@act.agency to company_admin';
    ELSE
      -- Insert new record
      INSERT INTO public.brand_users (user_id, brand_id, role)
      VALUES (v_dwayne_id, 'act', 'company_admin');
      RAISE NOTICE 'Added dwayne@act.agency as company_admin';
    END IF;
  ELSE
    RAISE WARNING 'User dwayne@act.agency not found - they need to sign up first';
  END IF;

  -- Promote danijel@act.agency
  IF v_danijel_id IS NOT NULL THEN
    -- Check if user exists in brand_users
    IF EXISTS (SELECT 1 FROM public.brand_users WHERE user_id = v_danijel_id AND brand_id = 'act') THEN
      -- Update existing record
      UPDATE public.brand_users
      SET role = 'company_admin', updated_at = NOW()
      WHERE user_id = v_danijel_id AND brand_id = 'act';
      RAISE NOTICE 'Updated danijel@act.agency to company_admin';
    ELSE
      -- Insert new record
      INSERT INTO public.brand_users (user_id, brand_id, role)
      VALUES (v_danijel_id, 'act', 'company_admin');
      RAISE NOTICE 'Added danijel@act.agency as company_admin';
    END IF;
  ELSE
    RAISE WARNING 'User danijel@act.agency not found - they need to sign up first';
  END IF;
END $$;

-- Verify the changes
SELECT 
  u.email,
  bu.role,
  bu.brand_id,
  bu.created_at,
  bu.updated_at
FROM public.brand_users bu
JOIN auth.users u ON u.id = bu.user_id
WHERE u.email IN ('dwayne@act.agency', 'danijel@act.agency')
  AND bu.brand_id = 'act'
ORDER BY u.email;
```

---

## Expected Output

You should see a table showing:
- `dwayne@act.agency` with `role = company_admin`
- `danijel@act.agency` with `role = company_admin`

If a user is not found, it means they haven't signed up yet. They need to:
1. Go to your app
2. Click "Sign in with GitHub"
3. Complete GitHub OAuth
4. Then run this SQL again

---

## Alternative: Via Supabase Table Editor

If you prefer using the UI:

1. Go to: **https://supabase.com/dashboard/project/pyvobennsmzyvtaceopn/editor**
2. Open table: **`brand_users`**
3. Find rows where:
   - `brand_id = 'act'`
   - User email is dwayne@act.agency or danijel@act.agency
4. Click on the `role` field
5. Change to `company_admin`
6. Save

---

## Verification

After running the SQL, verify by running:

```sql
SELECT * FROM list_company_admins();
```

You should see both users listed as Company Admins.
