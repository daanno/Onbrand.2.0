-- Debug Microsoft OAuth Database Error
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if trigger exists
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 2. Check if function exists and is valid
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user_with_auto_brand';

-- 3. Check if brands table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'brands'
ORDER BY ordinal_position;

-- 4. Check if brand_users table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'brand_users'
ORDER BY ordinal_position;

-- 5. Check if 'act' brand exists (for public email domains)
SELECT * FROM public.brands WHERE id = 'act';

-- 6. Check recent auth.users entries (last 5)
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check recent brand_users entries (last 5)
SELECT 
    bu.user_id,
    bu.brand_id,
    bu.role,
    bu.created_at,
    u.email
FROM public.brand_users bu
LEFT JOIN auth.users u ON bu.user_id = u.id
ORDER BY bu.created_at DESC
LIMIT 5;

-- 8. Check RLS policies on brand_users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'brand_users';

-- 9. Test trigger manually with a sample email
-- This will show you the exact error if there is one
DO $$
DECLARE
    test_email TEXT := 'test@creativetechnologists.nl';
    email_domain TEXT;
    brand_slug TEXT;
BEGIN
    email_domain := split_part(test_email, '@', 2);
    brand_slug := split_part(email_domain, '.', 1);
    
    RAISE NOTICE 'Test email: %', test_email;
    RAISE NOTICE 'Domain: %', email_domain;
    RAISE NOTICE 'Brand slug: %', brand_slug;
    
    -- Try to insert test brand
    INSERT INTO public.brands (id, name, description, created_at)
    VALUES (
        brand_slug || '_test',
        initcap(brand_slug) || ' Test',
        'Test brand',
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Test brand created successfully';
END $$;

-- 10. Check for any error logs (if available)
-- Note: This might not work depending on your Supabase plan
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%handle_new_user_with_auto_brand%'
ORDER BY calls DESC
LIMIT 5;
