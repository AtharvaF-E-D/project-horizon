import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { RolePermissions } from "@/config/permissions";
import type { Database } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: keyof RolePermissions;
  /** Restrict to one or more specific roles (e.g. ["owner"]). Owner-only routes use this. */
  requireRole?: AppRole | AppRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  permission,
  requireRole,
  redirectTo = "/dashboard",
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { permissions, role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const loading = authLoading || roleLoading;
  const allowedRoles = requireRole
    ? Array.isArray(requireRole)
      ? requireRole
      : [requireRole]
    : null;
  const roleOk = !allowedRoles || (role && allowedRoles.includes(role));
  const permOk = !permission || permissions[permission];

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading && user && (!permOk || !roleOk)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate(redirectTo);
    }
  }, [loading, user, permOk, roleOk, navigate, redirectTo, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !permOk || !roleOk) return null;
  return <>{children}</>;
};
