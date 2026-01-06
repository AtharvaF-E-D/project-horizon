-- Create segments table for subscriber segmentation
CREATE TABLE public.segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  match_type TEXT NOT NULL DEFAULT 'all', -- 'all' or 'any'
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email sequences table
CREATE TABLE public.email_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'subscription', 'segment_join', 'tag_added'
  trigger_value TEXT, -- specific tag or segment id
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'paused'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence steps (individual emails in a sequence)
CREATE TABLE public.sequence_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence enrollments (track who's in which sequence)
CREATE TABLE public.sequence_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused', 'unsubscribed'
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_send_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sequence_id, subscriber_id)
);

-- Enable RLS on all tables
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for segments
CREATE POLICY "Users can view own segments" ON public.segments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own segments" ON public.segments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own segments" ON public.segments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own segments" ON public.segments FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for email_sequences
CREATE POLICY "Users can view own sequences" ON public.email_sequences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sequences" ON public.email_sequences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sequences" ON public.email_sequences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sequences" ON public.email_sequences FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for sequence_steps (via sequence ownership)
CREATE POLICY "Users can view own sequence steps" ON public.sequence_steps FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own sequence steps" ON public.sequence_steps FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own sequence steps" ON public.sequence_steps FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own sequence steps" ON public.sequence_steps FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));

-- RLS policies for sequence_enrollments (via sequence ownership)
CREATE POLICY "Users can view own enrollments" ON public.sequence_enrollments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own enrollments" ON public.sequence_enrollments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own enrollments" ON public.sequence_enrollments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own enrollments" ON public.sequence_enrollments FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.email_sequences WHERE id = sequence_id AND user_id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON public.segments 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sequence_steps_updated_at BEFORE UPDATE ON public.sequence_steps 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create index for faster enrollment queries
CREATE INDEX idx_sequence_enrollments_next_send ON public.sequence_enrollments(next_send_at) WHERE status = 'active';