-- Create suspension_history table to track all suspension events
CREATE TABLE public.suspension_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'suspended', 'modified', 'lifted', 'blocked'
  suspended_until TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  performed_by UUID NOT NULL,
  performed_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.suspension_history ENABLE ROW LEVEL SECURITY;

-- Admins and owners can view suspension history
CREATE POLICY "Admins can view suspension history"
ON public.suspension_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Admins and owners can insert suspension history
CREATE POLICY "Admins can insert suspension history"
ON public.suspension_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_suspension_history_user_id ON public.suspension_history(user_id);
CREATE INDEX idx_suspension_history_created_at ON public.suspension_history(created_at DESC);