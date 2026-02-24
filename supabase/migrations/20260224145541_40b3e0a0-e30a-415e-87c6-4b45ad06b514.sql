
-- 1. Add new columns to grupos table
ALTER TABLE public.grupos
  ADD COLUMN IF NOT EXISTS whatsapp_group_id text,
  ADD COLUMN IF NOT EXISTS last_message text,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- Create index for whatsapp_group_id lookups
CREATE INDEX IF NOT EXISTS idx_grupos_whatsapp_group_id ON public.grupos(whatsapp_group_id);

-- 2. Create grupo_messages table
CREATE TABLE public.grupo_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id uuid REFERENCES public.grupos(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  sender_name text,
  message_text text,
  message_type text NOT NULL DEFAULT 'text',
  whatsapp_group_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grupo_messages_grupo_id ON public.grupo_messages(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupo_messages_whatsapp_group_id ON public.grupo_messages(whatsapp_group_id);
CREATE INDEX IF NOT EXISTS idx_grupo_messages_received_at ON public.grupo_messages(received_at DESC);

-- 3. Enable RLS
ALTER TABLE public.grupo_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grupo_messages_read_authenticated"
  ON public.grupo_messages FOR SELECT
  USING (true);

CREATE POLICY "grupo_messages_write_service"
  ON public.grupo_messages FOR ALL
  USING (can_manage_users(auth.uid()))
  WITH CHECK (can_manage_users(auth.uid()));

-- 4. Enable Realtime on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.grupos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grupo_messages;
