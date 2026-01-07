import { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { RolePermissions } from "@/config/permissions";

interface PermissionGateProps {
  children: ReactNode;
  permission: keyof RolePermissions;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions.
 * Use this to hide UI elements that the user doesn't have access to.
 * 
 * @example
 * <PermissionGate permission="canDeleteRecords">
 *   <Button variant="destructive">Delete</Button>
 * </PermissionGate>
 */
export const PermissionGate = ({ children, permission, fallback = null }: PermissionGateProps) => {
  const { permissions, loading } = useUserRole();

  if (loading) return null;

  if (!permissions[permission]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface MultiPermissionGateProps {
  children: ReactNode;
  permissions: (keyof RolePermissions)[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on multiple permissions.
 * 
 * @param requireAll - If true, all permissions must be granted. If false, any one permission grants access.
 * 
 * @example
 * <MultiPermissionGate permissions={["canManageTeam", "canEditSettings"]} requireAll={false}>
 *   <AdminPanel />
 * </MultiPermissionGate>
 */
export const MultiPermissionGate = ({ 
  children, 
  permissions: requiredPermissions, 
  requireAll = false,
  fallback = null 
}: MultiPermissionGateProps) => {
  const { permissions, loading } = useUserRole();

  if (loading) return null;

  const hasPermission = requireAll
    ? requiredPermissions.every(p => permissions[p])
    : requiredPermissions.some(p => permissions[p]);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
