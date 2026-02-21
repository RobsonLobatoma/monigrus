
-- Backfill existing users who don't have profiles yet
INSERT INTO public.user_profiles (user_id, email, full_name)
SELECT 
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, ''), '@', 1))
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.user_id = u.id
WHERE up.user_id IS NULL;

-- Backfill default roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'OPERACIONAL'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;
