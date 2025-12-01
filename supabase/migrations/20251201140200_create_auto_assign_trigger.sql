-- Create function to auto-assign users to brands on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Get brand_id from user metadata, default to 'act' if not provided
  INSERT INTO public.brand_users (user_id, brand_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'brand_id', 'act'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (user_id, brand_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
