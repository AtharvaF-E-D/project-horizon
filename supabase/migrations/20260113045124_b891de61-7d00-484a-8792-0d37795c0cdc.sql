-- Fix: Restrict profiles table visibility to prevent user data exposure
-- Users can only view their own profile, OR admins/owners/managers can view all profiles

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = id OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'manager')
  );