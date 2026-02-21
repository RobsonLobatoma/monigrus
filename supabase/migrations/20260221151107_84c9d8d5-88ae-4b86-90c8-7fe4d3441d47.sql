
-- Table: permissions
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  module text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_read_authenticated" ON public.permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "permissions_write_diretor" ON public.permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'DIRETOR'))
  WITH CHECK (public.has_role(auth.uid(), 'DIRETOR'));

-- Table: role_permissions
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_read_authenticated" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_write_diretor" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'DIRETOR'))
  WITH CHECK (public.has_role(auth.uid(), 'DIRETOR'));

-- Table: user_squad_history
CREATE TABLE public.user_squad_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_team_id uuid REFERENCES public.teams(id),
  new_team_id uuid REFERENCES public.teams(id),
  changed_by uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_squad_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_squad_history_read_authenticated" ON public.user_squad_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_squad_history_write_manager_plus" ON public.user_squad_history
  FOR ALL TO authenticated
  USING (public.can_manage_users(auth.uid()))
  WITH CHECK (public.can_manage_users(auth.uid()));

-- Seed permissions
INSERT INTO public.permissions (code, description, module) VALUES
  ('CREATE_USER', 'Criar novos usuários', 'usuarios'),
  ('EDIT_USER', 'Editar usuários existentes', 'usuarios'),
  ('CREATE_SQUAD', 'Criar novos squads', 'squads'),
  ('EDIT_SQUAD', 'Editar squads existentes', 'squads'),
  ('MANAGE_PERMISSIONS', 'Gerenciar matriz de permissões', 'permissoes'),
  ('VIEW_DASHBOARD_GLOBAL', 'Visualizar dashboard global', 'dashboard'),
  ('VIEW_DASHBOARD_SQUAD', 'Visualizar dashboard do squad', 'dashboard'),
  ('EXECUTE_TASKS', 'Executar tarefas operacionais', 'tarefas'),
  ('VIEW_MONITORAMENTO', 'Acessar painel de monitoramento', 'monitoramento'),
  ('VIEW_HUB', 'Acessar hub do colaborador', 'hub'),
  ('VIEW_ANOMALIAS', 'Acessar módulo de anomalias', 'anomalias'),
  ('VIEW_CONEXOES', 'Acessar módulo de conexões', 'conexoes'),
  ('VIEW_CONFIGURACOES', 'Acessar configurações', 'configuracoes');

-- Seed role_permissions
-- DIRETOR: all permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'DIRETOR'::public.app_role, id FROM public.permissions
WHERE code IN ('CREATE_USER','EDIT_USER','CREATE_SQUAD','EDIT_SQUAD','MANAGE_PERMISSIONS','VIEW_DASHBOARD_GLOBAL','VIEW_DASHBOARD_SQUAD','VIEW_MONITORAMENTO','VIEW_HUB','VIEW_ANOMALIAS','VIEW_CONEXOES','VIEW_CONFIGURACOES');

-- GERENTE: most except MANAGE_PERMISSIONS and VIEW_HUB
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'GERENTE'::public.app_role, id FROM public.permissions
WHERE code IN ('CREATE_USER','EDIT_USER','CREATE_SQUAD','EDIT_SQUAD','VIEW_DASHBOARD_GLOBAL','VIEW_DASHBOARD_SQUAD','VIEW_MONITORAMENTO','VIEW_ANOMALIAS','VIEW_CONEXOES','VIEW_CONFIGURACOES');

-- SUPERVISOR: limited set
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'SUPERVISOR'::public.app_role, id FROM public.permissions
WHERE code IN ('EDIT_USER','EDIT_SQUAD','VIEW_DASHBOARD_SQUAD','EXECUTE_TASKS','VIEW_MONITORAMENTO','VIEW_HUB','VIEW_CONFIGURACOES');

-- OPERACIONAL: minimal
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'OPERACIONAL'::public.app_role, id FROM public.permissions
WHERE code IN ('EXECUTE_TASKS','VIEW_HUB','VIEW_CONFIGURACOES');
