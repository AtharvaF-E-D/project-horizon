-- Add suspension fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL;

-- Create an index for efficient suspension checks
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_until ON public.profiles(suspended_until) WHERE suspended_until IS NOT NULL;

-- Create a function to check if a user is currently suspended
CREATE OR REPLACE FUNCTION public.is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND (
        is_active = false 
        OR (suspended_until IS NOT NULL AND suspended_until > now())
      )
  )
$$;

-- Allow admins to update any profile's suspension status
CREATE POLICY "Admins can update suspension status"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);