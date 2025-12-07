-- Create call_type enum
CREATE TYPE public.call_type AS ENUM ('incoming', 'outgoing');

-- Create call_status enum
CREATE TYPE public.call_status AS ENUM ('completed', 'missed', 'no_answer', 'busy', 'voicemail');

-- Create calls table for call logging
CREATE TABLE public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  company_name TEXT,
  call_type call_type NOT NULL DEFAULT 'outgoing',
  status call_status NOT NULL DEFAULT 'completed',
  duration_seconds INTEGER DEFAULT 0,
  notes TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own calls"
ON public.calls
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls"
ON public.calls
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calls"
ON public.calls
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calls"
ON public.calls
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_calls_user_id ON public.calls(user_id);
CREATE INDEX idx_calls_contact_id ON public.calls(contact_id);
CREATE INDEX idx_calls_created_at ON public.calls(created_at DESC);