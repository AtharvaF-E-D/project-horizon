
-- Recurrence columns on appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID;

CREATE INDEX IF NOT EXISTS idx_appointments_parent ON public.appointments(recurrence_parent_id);

-- Lead files table
CREATE TABLE IF NOT EXISTS public.lead_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lead files" ON public.lead_files
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lead files" ON public.lead_files
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own lead files" ON public.lead_files
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lead_files_lead ON public.lead_files(lead_id);

-- Storage bucket for lead attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-files', 'lead-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can view own lead attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'lead-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own lead attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lead-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own lead attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'lead-files' AND auth.uid()::text = (storage.foldername(name))[1]);
