-- Fix: Restrict user_roles table visibility to prevent role enumeration
-- Users can only view their own role, OR admins/owners/managers can view all roles

DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view roles" ON public.user_roles 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'manager')
  );