-- Verify user and brand assignment for Microsoft OAuth user
-- Run this in Supabase SQL Editor

-- 1. Check if user exists
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = '7b3b8534-bf59-4b19-813c-f827b044719a';

-- 2. Check if brand was created
SELECT * FROM brands 
WHERE id LIKE '%creative%' OR id = 'creativetechnologists';

-- 3. Check if user is assigned to brand
SELECT 
    bu.id,
    bu.user_id,
    bu.brand_id,
    bu.role,
    bu.created_at
FROM brand_users bu
WHERE bu.user_id = '7b3b8534-bf59-4b19-813c-f827b044719a';

-- 4. Check RLS policies on brand_users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'brand_users';

-- 5. Test if the query works with RLS bypassed (as service role)
-- This will tell us if it's an RLS issue or data issue
SET ROLE postgres;
SELECT * FROM brand_users 
WHERE user_id = '7b3b8534-bf59-4b19-813c-f827b044719a';
RESET ROLE;

-- 6. Manually insert brand_users record if missing
-- Run this ONLY if step 3 shows no results
INSERT INTO brand_users (user_id, brand_id, role)
VALUES (
    '7b3b8534-bf59-4b19-813c-f827b044719a',
    'creativetechnologists',  -- Change this to your actual brand_id
    'owner'
)
ON CONFLICT (user_id, brand_id) DO NOTHING;
