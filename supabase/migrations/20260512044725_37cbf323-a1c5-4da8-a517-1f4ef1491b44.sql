
-- =========================================================
-- 1. Restrict policies on data tables to {authenticated}
-- =========================================================

-- activities
DROP POLICY IF EXISTS "Users can delete own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
CREATE POLICY "Users can delete own activities" ON public.activities FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- calls
DROP POLICY IF EXISTS "Users can delete own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can insert own calls" ON public.calls;
DROP POLICY IF EXISTS "Users can update own calls" ON public.calls;
CREATE POLICY "Users can delete own calls" ON public.calls FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calls" ON public.calls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calls" ON public.calls FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- campaign_analytics
DROP POLICY IF EXISTS "Users can insert own campaign analytics" ON public.campaign_analytics;
CREATE POLICY "Users can insert own campaign analytics" ON public.campaign_analytics FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_analytics.campaign_id AND campaigns.user_id = auth.uid()));

-- campaigns
DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- companies
DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
CREATE POLICY "Users can delete own companies" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own companies" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- contacts
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- deals
DROP POLICY IF EXISTS "Users can delete own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can insert own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update own deals" ON public.deals;
CREATE POLICY "Users can delete own deals" ON public.deals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals" ON public.deals FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- email_sequences
DROP POLICY IF EXISTS "Users can delete own sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Users can insert own sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Users can update own sequences" ON public.email_sequences;
CREATE POLICY "Users can delete own sequences" ON public.email_sequences FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sequences" ON public.email_sequences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sequences" ON public.email_sequences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- email_templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.email_templates;
CREATE POLICY "Users can delete own templates" ON public.email_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.email_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- leads
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- segments
DROP POLICY IF EXISTS "Users can delete own segments" ON public.segments;
DROP POLICY IF EXISTS "Users can insert own segments" ON public.segments;
DROP POLICY IF EXISTS "Users can update own segments" ON public.segments;
CREATE POLICY "Users can delete own segments" ON public.segments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own segments" ON public.segments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own segments" ON public.segments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- sequence_enrollments
DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.sequence_enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.sequence_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.sequence_enrollments;
CREATE POLICY "Users can delete own enrollments" ON public.sequence_enrollments FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = sequence_enrollments.sequence_id AND email_sequences.user_id = auth.uid()));
CREATE POLICY "Users can insert own enrollments" ON public.sequence_enrollments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = sequence_enrollments.sequence_id AND email_sequences.user_id = auth.uid()));
CREATE POLICY "Users can update own enrollments" ON public.sequence_enrollments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = sequence_enrollments.sequence_id AND email_sequences.user_id = auth.uid()));

-- sequence_steps
DROP POLICY IF EXISTS "Users can delete own sequence steps" ON public.sequence_steps;
DROP POLICY IF EXISTS "Users can insert own sequence steps" ON public.sequence_steps;
DROP POLICY IF EXISTS "Users can update own sequence steps" ON public.sequence_steps;
CREATE POLICY "Users can delete own sequence steps" ON public.sequence_steps FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = sequence_steps.sequence_id AND email_sequences.user_id = auth.uid()));
CREATE POLICY "Users can insert own sequence steps" ON public.sequence_steps FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = sequence_steps.sequence_id AND email_sequences.user_id = auth.uid()));
CREATE POLICY "Users can update own sequence steps" ON public.sequence_steps FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM email_sequences WHERE email_sequences.id = sequence_steps.sequence_id AND email_sequences.user_id = auth.uid()));

-- subscribers
DROP POLICY IF EXISTS "Users can delete own subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert own subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscribers" ON public.subscribers;
CREATE POLICY "Users can delete own subscribers" ON public.subscribers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscribers" ON public.subscribers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscribers" ON public.subscribers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- tasks
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) OR (auth.uid() = assigned_to));

-- profiles - admin suspension policy
DROP POLICY IF EXISTS "Admins can update suspension status" ON public.profiles;
CREATE POLICY "Admins can update suspension status" ON public.profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- suspension_history
DROP POLICY IF EXISTS "Admins can insert suspension history" ON public.suspension_history;
DROP POLICY IF EXISTS "Admins can view suspension history" ON public.suspension_history;
CREATE POLICY "Admins can insert suspension history" ON public.suspension_history FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins can view suspension history" ON public.suspension_history FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- =========================================================
-- 2. Prevent privilege escalation: only owners can assign owner role
-- =========================================================
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  AND (role <> 'owner'::app_role OR has_role(auth.uid(), 'owner'::app_role))
);

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  AND (role <> 'owner'::app_role OR has_role(auth.uid(), 'owner'::app_role))
);

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  AND (role <> 'owner'::app_role OR has_role(auth.uid(), 'owner'::app_role))
);

-- =========================================================
-- 3. WhatsApp attachments: make private, owner-scoped storage policies
-- =========================================================
UPDATE storage.buckets SET public = false WHERE id = 'whatsapp-attachments';

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname ILIKE '%whatsapp%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.polname);
  END LOOP;
END $$;

CREATE POLICY "WhatsApp attachments owner read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'whatsapp-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "WhatsApp attachments owner insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'whatsapp-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "WhatsApp attachments owner update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'whatsapp-attachments' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'whatsapp-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "WhatsApp attachments owner delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'whatsapp-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
