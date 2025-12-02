-- Debug Signup Error SQL Script
-- Run these queries in Supabase SQL Editor to diagnose the issue

-- 1. Check if brands table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'brands'
) AS brands_table_exists;

-- 2. Check if brand_users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'brand_users'
) AS brand_users_table_exists;

-- 3. Check if trigger exists
SELECT tgname, tgenabled, tgrelid::regclass AS table_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 4. Check if function exists
SELECT 
  proname AS function_name,
  prosrc AS function_code
FROM pg_proc 
WHERE proname = 'handle_new_user_with_auto_brand';

-- 5. Check RLS policies on brand_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('brands', 'brand_users');

-- 6. Check recent auth.users entries (last 5)
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'brand_id' AS brand_id_from_metadata
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check recent brand_users entries
SELECT 
  bu.*,
  u.email
FROM public.brand_users bu
JOIN auth.users u ON u.id = bu.user_id
ORDER BY bu.created_at DESC
LIMIT 5;

-- 8. Test the function manually
DO $$
DECLARE
  test_email TEXT := 'test@example.com';
  test_domain TEXT;
  test_slug TEXT;
BEGIN
  test_domain := split_part(test_email, '@', 2);
  test_slug := split_part(test_domain, '.', 1);
  
  RAISE NOTICE 'Email: %', test_email;
  RAISE NOTICE 'Domain: %', test_domain;
  RAISE NOTICE 'Slug: %', test_slug;
END $$;
