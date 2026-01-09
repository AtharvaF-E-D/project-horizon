-- Add is_active column to profiles for account deactivation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create team invitations table
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'agent',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_invites - only admins/owners can manage invites
CREATE POLICY "Admins can view all invites"
ON public.team_invites FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner') OR 
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins can create invites"
ON public.team_invites FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner') OR 
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins can update invites"
ON public.team_invites FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner') OR 
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins can delete invites"
ON public.team_invites FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Create index for faster lookups
CREATE INDEX idx_team_invites_email ON public.team_invites(email);
CREATE INDEX idx_team_invites_status ON public.team_invites(status);