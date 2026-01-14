-- Fix all SELECT policies to explicitly require authenticated role instead of public
-- This ensures anonymous users cannot even attempt to query these tables

-- 1. contacts
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
CREATE POLICY "Users can view own contacts" ON public.contacts 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. leads
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
CREATE POLICY "Users can view own leads" ON public.leads 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. subscribers
DROP POLICY IF EXISTS "Users can view own subscribers" ON public.subscribers;
CREATE POLICY "Users can view own subscribers" ON public.subscribers 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. calls
DROP POLICY IF EXISTS "Users can view own calls" ON public.calls;
CREATE POLICY "Users can view own calls" ON public.calls 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 5. companies
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
CREATE POLICY "Users can view own companies" ON public.companies 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 6. deals
DROP POLICY IF EXISTS "Users can view own deals" ON public.deals;
CREATE POLICY "Users can view own deals" ON public.deals 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 7. campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
CREATE POLICY "Users can view own campaigns" ON public.campaigns 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 8. email_templates
DROP POLICY IF EXISTS "Users can view own templates" ON public.email_templates;
CREATE POLICY "Users can view own templates" ON public.email_templates 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 9. tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

-- 10. activities
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
CREATE POLICY "Users can view own activities" ON public.activities 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 11. segments
DROP POLICY IF EXISTS "Users can view own segments" ON public.segments;
CREATE POLICY "Users can view own segments" ON public.segments 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 12. email_sequences
DROP POLICY IF EXISTS "Users can view own sequences" ON public.email_sequences;
CREATE POLICY "Users can view own sequences" ON public.email_sequences 
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 13. sequence_steps
DROP POLICY IF EXISTS "Users can view own sequence steps" ON public.sequence_steps;
CREATE POLICY "Users can view own sequence steps" ON public.sequence_steps 
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.email_sequences es 
    WHERE es.id = sequence_id AND es.user_id = auth.uid()
  ));

-- 14. sequence_enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.sequence_enrollments;
CREATE POLICY "Users can view own enrollments" ON public.sequence_enrollments 
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.email_sequences es 
    WHERE es.id = sequence_id AND es.user_id = auth.uid()
  ));

-- 15. campaign_analytics
DROP POLICY IF EXISTS "Users can view own campaign analytics" ON public.campaign_analytics;
CREATE POLICY "Users can view own campaign analytics" ON public.campaign_analytics 
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.user_id = auth.uid()
  ));