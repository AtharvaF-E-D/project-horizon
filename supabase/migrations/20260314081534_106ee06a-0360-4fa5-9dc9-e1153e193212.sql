CREATE OR REPLACE FUNCTION public.log_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actor_id UUID;
  actor_email TEXT;
  target_email TEXT;
BEGIN
  actor_id := auth.uid();
  
  -- Skip audit logging if no authenticated user (e.g. during signup trigger)
  IF actor_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT email INTO actor_email FROM public.profiles WHERE id = actor_id;
  SELECT email INTO target_email FROM public.profiles WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
    VALUES (
      actor_id, actor_email, 'role_assigned', 'user_role', NEW.user_id::text,
      jsonb_build_object('target_user_id', NEW.user_id, 'target_email', target_email, 'new_role', NEW.role)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
    VALUES (
      actor_id, actor_email, 'role_changed', 'user_role', NEW.user_id::text,
      jsonb_build_object('target_user_id', NEW.user_id, 'target_email', target_email, 'old_role', OLD.role, 'new_role', NEW.role)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
    VALUES (
      actor_id, actor_email, 'role_removed', 'user_role', OLD.user_id::text,
      jsonb_build_object('target_user_id', OLD.user_id, 'target_email', target_email, 'removed_role', OLD.role)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;