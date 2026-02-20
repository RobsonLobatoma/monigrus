
-- Adicionar colunas ausentes em teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS supervisor text,
  ADD COLUMN IF NOT EXISTS gestores   text[] NOT NULL DEFAULT '{}';

-- Adicionar colunas ausentes em grupos
ALTER TABLE public.grupos
  ADD COLUMN IF NOT EXISTS gestor           text,
  ADD COLUMN IF NOT EXISTS sla              text NOT NULL DEFAULT 'DENTRO DO SLA',
  ADD COLUMN IF NOT EXISTS status           text NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN IF NOT EXISTS mensagens        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_atividade text;
