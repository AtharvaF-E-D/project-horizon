
-- Add attachment columns to whatsapp_messages
ALTER TABLE public.whatsapp_messages
  ADD COLUMN file_url text,
  ADD COLUMN file_name text,
  ADD COLUMN file_type text;

-- Create storage bucket for WhatsApp attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-attachments', 'whatsapp-attachments', true);

-- Storage policies
CREATE POLICY "Users can upload whatsapp attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view whatsapp attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-attachments');

CREATE POLICY "Users can delete own whatsapp attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'whatsapp-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
