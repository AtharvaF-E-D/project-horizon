-- Create audit_logs table for tracking sensitive security operations
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs 
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'owner')
  );

-- Authenticated users can insert their own audit logs
CREATE POLICY "Users can insert audit logs" ON public.audit_logs 
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No updates or deletes allowed (immutable audit trail)

-- Create index for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Create function to automatically log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_email TEXT;
  target_email TEXT;
BEGIN
  -- Get actor email
  SELECT email INTO actor_email FROM public.profiles WHERE id = auth.uid();
  
  -- Get target user email
  SELECT email INTO target_email FROM public.profiles WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      actor_email,
      'role_assigned',
      'user_role',
      NEW.user_id::text,
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'target_email', target_email,
        'new_role', NEW.role
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      actor_email,
      'role_changed',
      'user_role',
      NEW.user_id::text,
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'target_email', target_email,
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      actor_email,
      'role_removed',
      'user_role',
      OLD.user_id::text,
      jsonb_build_object(
        'target_user_id', OLD.user_id,
        'target_email', target_email,
        'removed_role', OLD.role
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on user_roles table
CREATE TRIGGER audit_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();