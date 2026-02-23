
-- Adicionar capacidade maxima aos squads
ALTER TABLE public.teams 
  ADD COLUMN IF NOT EXISTS capacidade_maxima integer NOT NULL DEFAULT 110;

-- Adicionar capacidade maxima por gestor
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS capacidade_maxima_gestor integer NOT NULL DEFAULT 35;

-- Adicionar gestor_id (uuid simples, sem FK para auth.users)
ALTER TABLE public.grupos 
  ADD COLUMN IF NOT EXISTS gestor_id uuid;

-- Inserir permissao VIEW_SQUADS
INSERT INTO public.permissions (code, description, module) 
  VALUES ('VIEW_SQUADS', 'Visualizar painel de squads', 'SQUADS')
  ON CONFLICT (code) DO NOTHING;

-- Conceder permissao a DIRETOR, GERENTE e SUPERVISOR
INSERT INTO public.role_permissions (role, permission_id)
  SELECT r.role, p.id 
  FROM (VALUES ('DIRETOR'::app_role), ('GERENTE'::app_role), ('SUPERVISOR'::app_role)) AS r(role)
  CROSS JOIN public.permissions p 
  WHERE p.code = 'VIEW_SQUADS'
  ON CONFLICT DO NOTHING;
