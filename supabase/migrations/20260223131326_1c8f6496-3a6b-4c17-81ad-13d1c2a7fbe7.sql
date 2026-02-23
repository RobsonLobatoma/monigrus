
-- =============================================
-- WhatsApp Integration Layer - Database Schema
-- =============================================

-- Table: whatsapp_providers
CREATE TABLE public.whatsapp_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_providers_read_authenticated" ON public.whatsapp_providers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "whatsapp_providers_write_manager" ON public.whatsapp_providers
  FOR ALL TO authenticated
  USING (can_manage_users(auth.uid()))
  WITH CHECK (can_manage_users(auth.uid()));

CREATE TRIGGER update_whatsapp_providers_updated_at
  BEFORE UPDATE ON public.whatsapp_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: whatsapp_instances
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.whatsapp_providers(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  phone_number text,
  status text NOT NULL DEFAULT 'disconnected',
  qr_code text,
  session_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_health_check timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_instances_read_authenticated" ON public.whatsapp_instances
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "whatsapp_instances_write_manager" ON public.whatsapp_instances
  FOR ALL TO authenticated
  USING (can_manage_users(auth.uid()))
  WITH CHECK (can_manage_users(auth.uid()));

CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: whatsapp_message_log
CREATE TABLE public.whatsapp_message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  direction text NOT NULL DEFAULT 'outbound',
  message_type text NOT NULL DEFAULT 'text',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  error_message text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_message_log_read_authenticated" ON public.whatsapp_message_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "whatsapp_message_log_write_manager" ON public.whatsapp_message_log
  FOR ALL TO authenticated
  USING (can_manage_users(auth.uid()))
  WITH CHECK (can_manage_users(auth.uid()));

-- Table: whatsapp_webhooks_log
CREATE TABLE public.whatsapp_webhooks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_webhooks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_webhooks_log_read_authenticated" ON public.whatsapp_webhooks_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "whatsapp_webhooks_log_write_manager" ON public.whatsapp_webhooks_log
  FOR ALL TO authenticated
  USING (can_manage_users(auth.uid()))
  WITH CHECK (can_manage_users(auth.uid()));

-- Seed: Evolution API as default provider
INSERT INTO public.whatsapp_providers (name, display_name, is_active, is_default, config)
VALUES (
  'evolution',
  'Evolution API',
  true,
  true,
  '{"base_url": "", "api_key_secret_name": "EVOLUTION_API_KEY"}'::jsonb
);
