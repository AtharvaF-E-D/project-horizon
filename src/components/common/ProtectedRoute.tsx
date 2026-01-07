import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { RolePermissions } from "@/config/permissions";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: keyof RolePermissions;
  redirectTo?: string;
}

/**
 * Component that protects routes based on authentication and permissions.
 * Wrap page components with this to enforce access control.
 * 
 * @example
 * <ProtectedRoute permission="roles">
 *   <RoleManagement />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({ 
  children, 
  permission, 
  redirectTo = "/dashboard" 
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const loading = authLoading || roleLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading && user && permission && !permissions[permission]) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate(redirectTo);
    }
  }, [loading, user, permission, permissions, navigate, redirectTo, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (permission && !permissions[permission]) {
    return null;
  }

  return <>{children}</>;
};
