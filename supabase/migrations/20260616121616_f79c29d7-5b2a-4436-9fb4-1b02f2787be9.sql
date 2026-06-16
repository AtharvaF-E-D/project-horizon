ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS wa_message_id text;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_message_id
  ON public.whatsapp_messages(wa_message_id);