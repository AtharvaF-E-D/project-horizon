import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuditLogger } from "@/hooks/useAuditLogger";
import { useRateLimiter } from "@/hooks/useRateLimiter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, Search, Users, Crown, UserCog, User, Eye } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  title: string | null;
  department: string | null;
  role: AppRole;
}

const ROLE_OPTIONS: { value: AppRole; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "owner", label: "Owner", icon: <Crown className="h-4 w-4" />, description: "Full access, can transfer ownership" },
  { value: "admin", label: "Admin", icon: <Shield className="h-4 w-4" />, description: "Full access, manage users & roles" },
  { value: "manager", label: "Manager", icon: <UserCog className="h-4 w-4" />, description: "Manage team, view reports" },
  { value: "agent", label: "Agent", icon: <User className="h-4 w-4" />, description: "Standard access, manage own data" },
  { value: "viewer", label: "Viewer", icon: <Eye className="h-4 w-4" />, description: "Read-only access" },
];

const getRoleBadgeVariant = (role: AppRole) => {
  switch (role) {
    case "owner": return "default";
    case "admin": return "destructive";
    case "manager": return "secondary";
    case "agent": return "outline";
    case "viewer": return "outline";
    default: return "outline";
  }
};

const getRoleIcon = (role: AppRole) => {
  const option = ROLE_OPTIONS.find(r => r.value === role);
  return option?.icon || <User className="h-4 w-4" />;
};

const RoleManagement = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { canManageRoles, isOwner, loading: roleLoading, permissions } = useUserRole();
  const { logRoleChange } = useAuditLogger();
  const { checkRateLimit } = useRateLimiter();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !permissions.roles && user) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [permissions.roles, roleLoading, user, navigate, toast]);

  useEffect(() => {
    if (canManageRoles) {
      fetchUsers();
    }
  }, [canManageRoles]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, title, department");

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "agent",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    // Prevent changing own role if owner
    if (userId === user?.id && isOwner) {
      toast({
        title: "Cannot Change Own Role",
        description: "Owners cannot change their own role. Transfer ownership first.",
        variant: "destructive",
      });
      return;
    }

    // Prevent non-owners from assigning owner role
    if (newRole === "owner" && !isOwner) {
      toast({
        title: "Permission Denied",
        description: "Only owners can assign the owner role.",
        variant: "destructive",
      });
      return;
    }

    // Check rate limit before proceeding
    const rateLimit = await checkRateLimit("role_change");
    if (!rateLimit.allowed) {
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    const oldRole = targetUser?.role;

    setUpdatingUserId(userId);
    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;

        // Log role change with email notification
        await logRoleChange(
          "role_changed",
          userId,
          targetUser?.email || "",
          oldRole,
          newRole
        );
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;

        // Log role assignment with email notification
        await logRoleChange(
          "role_assigned",
          userId,
          targetUser?.email || "",
          undefined,
          newRole
        );
      }

      // Update local state
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );

      toast({
        title: "Role Updated",
        description: `User role has been changed to ${newRole}.`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(searchLower) ||
      (u.full_name?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const roleCounts = ROLE_OPTIONS.map(role => ({
    ...role,
    count: users.filter(u => u.role === role.value).length,
  }));

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <DashboardNav />
        <main className="ml-64 pt-20 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />

      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Role Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Assign and manage user roles and permissions
            </p>
          </div>

          {/* Role Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {roleCounts.map(role => (
              <Card key={role.value} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {role.icon}
                      <span className="text-sm font-medium">{role.label}</span>
                    </div>
                    <Badge variant={getRoleBadgeVariant(role.value)}>{role.count}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    {users.length} users total
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback>
                                {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{u.full_name || "No name"}</p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{u.department || "—"}</TableCell>
                        <TableCell>{u.title || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(u.role)} className="flex items-center gap-1 w-fit">
                            {getRoleIcon(u.role)}
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.id === user?.id ? (
                            <span className="text-sm text-muted-foreground">You</span>
                          ) : (
                            <Select
                              value={u.role}
                              onValueChange={(value: AppRole) => handleRoleChange(u.id, value)}
                              disabled={updatingUserId === u.id || (u.role === "owner" && !isOwner)}
                            >
                              <SelectTrigger className="w-32">
                                {updatingUserId === u.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((role) => (
                                  <SelectItem
                                    key={role.value}
                                    value={role.value}
                                    disabled={role.value === "owner" && !isOwner}
                                  >
                                    <div className="flex items-center gap-2">
                                      {role.icon}
                                      {role.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Permissions Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>Overview of what each role can do</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead className="text-center">Owner</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                    <TableHead className="text-center">Manager</TableHead>
                    <TableHead className="text-center">Agent</TableHead>
                    <TableHead className="text-center">Viewer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Manage User Roles", owner: true, admin: true, manager: false, agent: false, viewer: false },
                    { name: "View All Team Data", owner: true, admin: true, manager: true, agent: false, viewer: false },
                    { name: "Edit System Settings", owner: true, admin: true, manager: false, agent: false, viewer: false },
                    { name: "Manage Own Leads/Deals", owner: true, admin: true, manager: true, agent: true, viewer: false },
                    { name: "View Reports", owner: true, admin: true, manager: true, agent: true, viewer: true },
                    { name: "Export Data", owner: true, admin: true, manager: true, agent: false, viewer: false },
                    { name: "Delete Records", owner: true, admin: true, manager: true, agent: true, viewer: false },
                    { name: "Transfer Ownership", owner: true, admin: false, manager: false, agent: false, viewer: false },
                  ].map((perm) => (
                    <TableRow key={perm.name}>
                      <TableCell className="font-medium">{perm.name}</TableCell>
                      <TableCell className="text-center">{perm.owner ? "✓" : "—"}</TableCell>
                      <TableCell className="text-center">{perm.admin ? "✓" : "—"}</TableCell>
                      <TableCell className="text-center">{perm.manager ? "✓" : "—"}</TableCell>
                      <TableCell className="text-center">{perm.agent ? "✓" : "—"}</TableCell>
                      <TableCell className="text-center">{perm.viewer ? "✓" : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RoleManagement;
