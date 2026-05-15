
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ai_score_label text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_next_action text,
  ADD COLUMN IF NOT EXISTS ai_updated_at timestamptz;

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS sentiment text,
  ADD COLUMN IF NOT EXISTS transcript text;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS ai_intent text;
