-- Enhanced auto-brand creation with public email domain handling
-- Public domains (Gmail, Yahoo, etc.) → "act" brand for testing
-- Company domains → Own brand for production

CREATE OR REPLACE FUNCTION public.handle_new_user_with_auto_brand()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  brand_slug TEXT;
  brand_display_name TEXT;
  is_owner BOOLEAN := false;
  -- List of public email providers (testing only)
  public_domains TEXT[] := ARRAY[
    'gmail.com', 'googlemail.com',
    'yahoo.com', 'yahoo.co.uk', 'ymail.com',
    'hotmail.com', 'hotmail.co.uk', 'live.com', 'outlook.com',
    'icloud.com', 'me.com', 'mac.com',
    'aol.com', 'aim.com',
    'protonmail.com', 'proton.me',
    'mail.com', 'zoho.com',
    'inbox.com', 'fastmail.com'
  ];
BEGIN
  -- Extract domain from email
  email_domain := split_part(NEW.email, '@', 2);
  
  -- Check if it's a public email domain
  IF email_domain = ANY(public_domains) THEN
    -- Public email → Generic "act" brand for testing
    brand_slug := 'act';
    is_owner := false;  -- Public emails are never owners
    
    RAISE NOTICE 'Public email domain detected: % → Generic "act" brand', email_domain;
  ELSE
    -- Company email → Create own brand
    brand_slug := split_part(email_domain, '.', 1);
    brand_display_name := initcap(brand_slug);
    
    -- Check if this is the first user from this company
    is_owner := NOT EXISTS (
      SELECT 1 FROM public.brand_users WHERE brand_id = brand_slug
    );
    
    -- Create brand if doesn't exist
    INSERT INTO public.brands (id, name, description, created_at)
    VALUES (
      brand_slug,
      brand_display_name,
      'Auto-created from ' || email_domain,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Company email detected: % → Brand "%" (owner: %)', 
      email_domain, brand_slug, is_owner;
  END IF;
  
  -- Assign user to brand with appropriate role
  INSERT INTO public.brand_users (user_id, brand_id, role)
  VALUES (
    NEW.id,
    brand_slug,
    CASE 
      WHEN is_owner THEN 'owner'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    END
  )
  ON CONFLICT (user_id, brand_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_auto_brand();

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user_with_auto_brand IS 
'Auto-creates brands from company email domains. Public email providers (Gmail, Yahoo, etc.) are assigned to generic "act" brand for testing.';
