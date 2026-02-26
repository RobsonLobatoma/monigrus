-- Vincular todos os usuários existentes à organização principal
INSERT INTO public.organization_members (organization_id, user_id)
SELECT
  '5169da33-e0bb-4ddb-b5d3-9fc03197f97f',
  up.user_id
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_members om WHERE om.user_id = up.user_id
)
ON CONFLICT DO NOTHING;

-- Atualizar trigger para auto-criar membership
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid;
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'OPERACIONAL'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Auto-vincular à organização (se houver exatamente uma)
  SELECT id INTO _org_id FROM public.organizations LIMIT 1;
  IF _org_id IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id)
    VALUES (_org_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;