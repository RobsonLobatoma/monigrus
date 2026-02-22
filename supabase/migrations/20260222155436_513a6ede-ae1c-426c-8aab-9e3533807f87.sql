
-- Table: monitoring_settings
CREATE TABLE public.monitoring_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  label text NOT NULL,
  color text DEFAULT '',
  min_value integer,
  max_value integer,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.monitoring_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_settings_read_authenticated"
  ON public.monitoring_settings FOR SELECT
  USING (true);

CREATE POLICY "monitoring_settings_write_manager_plus"
  ON public.monitoring_settings FOR ALL
  USING (can_manage_users(auth.uid()))
  WITH CHECK (can_manage_users(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_monitoring_settings_updated_at
  BEFORE UPDATE ON public.monitoring_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data
INSERT INTO public.monitoring_settings (category, label, color, sort_order) VALUES
  ('SATISFACAO', 'Ótimo',   '#22c55e', 1),
  ('SATISFACAO', 'Regular', '#facc15', 2),
  ('SATISFACAO', 'Ruim',    '#ef4444', 3);

INSERT INTO public.monitoring_settings (category, label, color, sort_order) VALUES
  ('STATUS', 'RESOLVIDO', '#22c55e', 1),
  ('STATUS', 'PENDENTE',  '#facc15', 2),
  ('STATUS', 'CRÍTICO',   '#ef4444', 3);

INSERT INTO public.monitoring_settings (category, label, color, min_value, max_value, sort_order) VALUES
  ('SCORE', 'Ruim',    '#ef4444', 0,  40,  1),
  ('SCORE', 'Regular', '#facc15', 41, 70,  2),
  ('SCORE', 'Ótimo',   '#22c55e', 71, 100, 3);

INSERT INTO public.monitoring_settings (category, label, sort_order) VALUES
  ('PALAVRA_CHAVE', 'reclamou',    1),
  ('PALAVRA_CHAVE', 'sem retorno', 2),
  ('PALAVRA_CHAVE', 'confirmou',   3);
