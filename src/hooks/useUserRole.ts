import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getPermissions, RolePermissions } from "@/config/permissions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RolePermissions>(getPermissions(null));

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setPermissions(getPermissions(null));
        setLoading(false);
        return;
      }

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
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  const isOwner = role === "owner";
  const isAdmin = role === "admin" || role === "owner";
  const isManager = role === "manager" || isAdmin;
  const canManageRoles = isAdmin;

  return { role, loading, isOwner, isAdmin, isManager, canManageRoles, permissions };
};
