-- Create enum for activity types
CREATE TYPE public.activity_type AS ENUM (
  'lead_created', 'lead_updated', 'lead_status_changed', 'lead_converted',
  'deal_created', 'deal_updated', 'deal_stage_changed', 'deal_won', 'deal_lost',
  'task_created', 'task_completed', 'task_updated',
  'contact_created', 'contact_updated',
  'company_created', 'company_updated',
  'note_added', 'email_sent', 'call_made', 'meeting_scheduled'
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own activities"
ON public.activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
ON public.activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
ON public.activities FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_activities_user_created ON public.activities(user_id, created_at DESC);
CREATE INDEX idx_activities_entity ON public.activities(entity_type, entity_id);