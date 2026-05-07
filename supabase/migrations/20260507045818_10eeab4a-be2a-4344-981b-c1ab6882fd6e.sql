
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all invites" ON public.team_invites;
CREATE POLICY "Inviter and admins can view invites"
ON public.team_invites
FOR SELECT
TO authenticated
USING (
  auth.uid() = invited_by
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);
