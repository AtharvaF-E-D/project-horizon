-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only what's needed.

-- Trigger-only functions: not callable by any client role
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_role_change() FROM PUBLIC, anon, authenticated;

-- Functions used inside RLS policies / by signed-in users only
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_user_suspended(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_suspended(uuid) TO authenticated;

-- Rate limit RPC: signed-in users only
REVOKE ALL ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO authenticated;

-- Ensure realtime change broadcasts include user_id for filter validation
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;