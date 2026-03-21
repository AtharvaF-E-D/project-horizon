import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getPermissions, RolePermissions } from "@/config/permissions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions>(getPermissions(null));

  useEffect(() => {
    // Don't resolve until auth is done loading
    if (authLoading) {
      setRoleLoading(true);
      return;
    }

    if (!user) {
      setRole(null);
      setPermissions(getPermissions(null));
      setRoleLoading(false);
      return;
    }

    // User is available, fetch role
    setRoleLoading(true);

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
        setPermissions(getPermissions(null));
      } else {
        const userRole = data?.role || null;
        setRole(userRole);
        setPermissions(getPermissions(userRole));
      }
      setRoleLoading(false);
    };

    fetchRole();
  }, [user, authLoading]);

  const loading = authLoading || roleLoading;
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || role === "owner";
  const isManager = role === "manager" || isAdmin;
  const canManageRoles = isAdmin;

  return { role, loading, isOwner, isAdmin, isManager, canManageRoles, permissions };
};
