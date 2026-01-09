import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  UserPlus,
  Users,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  title: string;
  department: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
}

interface TeamInvite {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by: string | null;
}

const Team = () => {
  const { user } = useAuth();
  const { permissions, isAdmin, isOwner, role: currentUserRole } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("agent");
  const [editRole, setEditRole] = useState<AppRole>("agent");
  const [editTitle, setEditTitle] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
    fetchInvites();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const members = profiles?.map((profile) => ({
        id: profile.id,
        full_name: profile.full_name || "Unknown",
        email: profile.email,
        title: profile.title || "",
        department: profile.department || "",
        role: (roles?.find((r) => r.user_id === profile.id)?.role || "agent") as AppRole,
        is_active: (profile as { is_active?: boolean }).is_active !== false,
        created_at: profile.created_at,
      })) || [];

      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from("team_invites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Check if user already exists
    const existingMember = teamMembers.find(
      (m) => m.email.toLowerCase() === inviteEmail.toLowerCase()
    );
    if (existingMember) {
      toast.error("This user is already a team member");
      return;
    }

    // Check if invite already exists
    const existingInvite = invites.find(
      (i) => i.email.toLowerCase() === inviteEmail.toLowerCase() && i.status === "pending"
    );
    if (existingInvite) {
      toast.error("An invitation has already been sent to this email");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("team_invites").insert({
        email: inviteEmail.toLowerCase(),
        role: inviteRole,
        invited_by: user?.id,
      });

      if (error) throw error;

      toast.success("Invitation sent successfully");
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("agent");
      fetchInvites();
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditTitle(member.title);
    setEditDepartment(member.department);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          title: editTitle,
          department: editDepartment,
        })
        .eq("id", selectedMember.id);

      if (profileError) throw profileError;

      // Update role if changed
      if (editRole !== selectedMember.role) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: editRole })
          .eq("user_id", selectedMember.id);

        if (roleError) throw roleError;
      }

      toast.success("Team member updated successfully");
      setEditDialogOpen(false);
      setSelectedMember(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    if (member.id === user?.id) {
      toast.error("You cannot deactivate your own account");
      return;
    }

    if (member.role === "owner" && !isOwner) {
      toast.error("Only owners can deactivate other owners");
      return;
    }

    setSelectedMember(member);
    setDeactivateDialogOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedMember) return;

    setSubmitting(true);
    try {
      const newStatus = !selectedMember.is_active;
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: newStatus })
        .eq("id", selectedMember.id);

      if (error) throw error;

      toast.success(
        newStatus
          ? "Team member reactivated successfully"
          : "Team member deactivated successfully"
      );
      setDeactivateDialogOpen(false);
      setSelectedMember(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error toggling member status:", error);
      toast.error("Failed to update member status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("team_invites")
        .update({ status: "cancelled" })
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Invitation cancelled");
      fetchInvites();
    } catch (error) {
      console.error("Error cancelling invite:", error);
      toast.error("Failed to cancel invitation");
    }
  };

  const handleResendInvite = async (invite: TeamInvite) => {
    try {
      // Create a new invite
      const { error } = await supabase.from("team_invites").insert({
        email: invite.email,
        role: invite.role,
        invited_by: user?.id,
      });

      if (error) throw error;

      // Cancel the old one
      await supabase
        .from("team_invites")
        .update({ status: "cancelled" })
        .eq("id", invite.id);

      toast.success("Invitation resent successfully");
      fetchInvites();
    } catch (error) {
      console.error("Error resending invite:", error);
      toast.error("Failed to resend invitation");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      admin: "bg-red-500/10 text-red-500 border-red-500/20",
      manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      agent: "bg-green-500/10 text-green-500 border-green-500/20",
      viewer: "bg-muted text-muted-foreground border-border",
    };
    return colors[role] || "bg-muted text-muted-foreground";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><XCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canEditRole = (memberRole: AppRole) => {
    if (isOwner) return true;
    if (isAdmin && memberRole !== "owner") return true;
    return false;
  };

  const availableRoles: AppRole[] = isOwner
    ? ["owner", "admin", "manager", "agent", "viewer"]
    : ["admin", "manager", "agent", "viewer"];

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMembers = filteredMembers.filter((m) => m.is_active);
  const inactiveMembers = filteredMembers.filter((m) => !m.is_active);
  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8 ml-64">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Team Management</h1>
              <p className="text-muted-foreground">
                Manage your team members, invitations, and roles
              </p>
            </div>
            {permissions.canManageTeam && (
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeMembers.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Mail className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Invites</p>
                  <p className="text-2xl font-bold">{pendingInvites.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <UserX className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold">{inactiveMembers.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">
                Active Members ({activeMembers.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive ({inactiveMembers.length})
              </TabsTrigger>
              <TabsTrigger value="invites">
                Invitations ({pendingInvites.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {member.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getRoleBadgeColor(member.role)}
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{member.title || "-"}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.department || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(member.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {permissions.canManageTeam && canEditRole(member.role) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditMember(member)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Member
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(member)}
                                  className="text-destructive"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeMembers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No active team members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="inactive">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveMembers.map((member) => (
                      <TableRow key={member.id} className="opacity-60">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {member.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{member.title || "-"}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.department || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {permissions.canManageTeam && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(member)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reactivate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {inactiveMembers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          No inactive team members
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="invites">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span>{invite.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getRoleBadgeColor(invite.role)}
                          >
                            {invite.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(invite.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(invite.expires_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {invite.status === "pending" && permissions.canManageTeam && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleResendInvite(invite)}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Resend Invite
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleCancelInvite(invite.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancel Invite
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {invites.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No invitations sent yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Invite Dialog */}
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team. They will receive an
                  email with instructions to set up their account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) => setInviteRole(value as AppRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === "admin" && "Full access to all features and settings"}
                    {inviteRole === "manager" && "Can manage team and view reports"}
                    {inviteRole === "agent" && "Standard user with access to core features"}
                    {inviteRole === "viewer" && "Read-only access to data"}
                    {inviteRole === "owner" && "Complete control over the organization"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={submitting}>
                  {submitting ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Member Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Team Member</DialogTitle>
                <DialogDescription>
                  Update role and profile information for {selectedMember?.full_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editRole}
                    onValueChange={(value) => setEditRole(value as AppRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g. Sales Manager"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    placeholder="e.g. Sales"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Deactivate Confirmation */}
          <AlertDialog
            open={deactivateDialogOpen}
            onOpenChange={setDeactivateDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {selectedMember?.is_active
                    ? "Deactivate Team Member"
                    : "Reactivate Team Member"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedMember?.is_active
                    ? `Are you sure you want to deactivate ${selectedMember?.full_name}? They will no longer be able to access the system.`
                    : `Are you sure you want to reactivate ${selectedMember?.full_name}? They will regain access to the system.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmToggleActive}
                  className={
                    selectedMember?.is_active
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : ""
                  }
                >
                  {submitting
                    ? "Processing..."
                    : selectedMember?.is_active
                    ? "Deactivate"
                    : "Reactivate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
};

export default Team;
