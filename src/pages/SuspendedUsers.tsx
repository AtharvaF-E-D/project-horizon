import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserX,
  Search,
  Clock,
  Shield,
  Ban,
  UserCheck,
  Loader2,
  AlertTriangle,
  Calendar,
  Timer,
  Edit,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInSeconds, isPast } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

interface SuspendedUser {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  avatar_url: string | null;
}

type SuspensionDuration = "1h" | "24h" | "7d" | "30d" | "permanent";

const SUSPENSION_OPTIONS: { value: SuspensionDuration; label: string }[] = [
  { value: "1h", label: "1 Hour" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "permanent", label: "Permanent" },
];

const getSuspensionEndDate = (duration: SuspensionDuration): Date | null => {
  const now = new Date();
  switch (duration) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "permanent":
      return null;
    default:
      return null;
  }
};

const SuspendedUsers = () => {
  const { user } = useAuth();
  const { permissions, loading: rolesLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "temporary" | "permanent">("all");
  const [liftDialogOpen, setLiftDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SuspendedUser | null>(null);
  const [newDuration, setNewDuration] = useState<SuspensionDuration>("24h");
  const [newReason, setNewReason] = useState("");
  const [, setNow] = useState(new Date());

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch suspended users
  const { data: suspendedUsers, isLoading } = useQuery({
    queryKey: ["suspended-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, suspended_until, suspension_reason, avatar_url")
        .or("is_active.eq.false,suspended_until.not.is.null");

      if (error) throw error;
      
      // Filter to only include actually suspended users
      return (data as SuspendedUser[]).filter(
        (u) => !u.is_active || (u.suspended_until && !isPast(new Date(u.suspended_until)))
      );
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Lift suspension mutation
  const liftSuspensionMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: true,
          suspended_until: null,
          suspension_reason: null,
        })
        .eq("id", userId);

      if (error) throw error;

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: user?.id || "",
        user_email: user?.email || null,
        action: "suspension_lifted",
        entity_type: "user_suspension",
        entity_id: userId,
        details: { target_user_id: userId },
      });

      return userId;
    },
    onSuccess: () => {
      toast.success("Suspension lifted successfully");
      queryClient.invalidateQueries({ queryKey: ["suspended-users"] });
      setLiftDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast.error("Failed to lift suspension");
    },
  });

  // Edit suspension mutation
  const editSuspensionMutation = useMutation({
    mutationFn: async ({
      userId,
      duration,
      reason,
    }: {
      userId: string;
      duration: SuspensionDuration;
      reason: string;
    }) => {
      const endDate = getSuspensionEndDate(duration);
      const isPermanent = duration === "permanent";

      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: isPermanent ? false : true,
          suspended_until: endDate?.toISOString() || null,
          suspension_reason: reason,
        })
        .eq("id", userId);

      if (error) throw error;

      // Log the action
      await supabase.from("audit_logs").insert({
        user_id: user?.id || "",
        user_email: user?.email || null,
        action: "suspension_modified",
        entity_type: "user_suspension",
        entity_id: userId,
        details: {
          target_user_id: userId,
          new_duration: duration,
          new_reason: reason,
          suspended_until: endDate?.toISOString() || "permanent",
        },
      });

      return { userId, duration };
    },
    onSuccess: () => {
      toast.success("Suspension updated successfully");
      queryClient.invalidateQueries({ queryKey: ["suspended-users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast.error("Failed to update suspension");
    },
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!suspendedUsers) return [];

    let filtered = suspendedUsers;

    // Apply type filter
    if (filterType === "temporary") {
      filtered = filtered.filter((u) => u.is_active && u.suspended_until);
    } else if (filterType === "permanent") {
      filtered = filtered.filter((u) => !u.is_active);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          u.full_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [suspendedUsers, filterType, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!suspendedUsers) return { total: 0, temporary: 0, permanent: 0 };

    const temporary = suspendedUsers.filter((u) => u.is_active && u.suspended_until).length;
    const permanent = suspendedUsers.filter((u) => !u.is_active).length;

    return {
      total: suspendedUsers.length,
      temporary,
      permanent,
    };
  }, [suspendedUsers]);

  const getInitials = (email: string, name: string | null) => {
    if (name) {
      return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() || "")
        .join("");
    }
    const parts = email.split("@")[0].split(/[._-]/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  };

  const getRemainingTime = (suspendedUntil: string | null, isActive: boolean) => {
    if (!isActive) {
      return { text: "Permanent", color: "text-red-500", urgent: true };
    }
    if (!suspendedUntil) return null;

    const endDate = new Date(suspendedUntil);
    if (isPast(endDate)) {
      return { text: "Expired", color: "text-muted-foreground", urgent: false };
    }

    const seconds = differenceInSeconds(endDate, new Date());
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 24) {
      return {
        text: formatDistanceToNow(endDate, { addSuffix: false }),
        color: "text-amber-500",
        urgent: false,
      };
    }

    if (hours > 0) {
      return {
        text: `${hours}h ${minutes}m`,
        color: "text-amber-500",
        urgent: hours < 2,
      };
    }

    return {
      text: `${minutes}m ${secs}s`,
      color: "text-red-500",
      urgent: true,
    };
  };

  const handleLiftClick = (user: SuspendedUser) => {
    setSelectedUser(user);
    setLiftDialogOpen(true);
  };

  const handleEditClick = (user: SuspendedUser) => {
    setSelectedUser(user);
    setNewReason(user.suspension_reason || "");
    setNewDuration("24h");
    setEditDialogOpen(true);
  };

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!permissions.roles) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />

      <main className="pl-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <UserX className="w-8 h-8 text-destructive" />
              Suspended Users
            </h1>
            <p className="text-muted-foreground">
              Manage user suspensions and blocks
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <UserX className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Suspended</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <Timer className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.temporary}</p>
                    <p className="text-sm text-muted-foreground">Temporary</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <Ban className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.permanent}</p>
                    <p className="text-sm text-muted-foreground">Permanent Blocks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suspensions</SelectItem>
                    <SelectItem value="temporary">Temporary Only</SelectItem>
                    <SelectItem value="permanent">Permanent Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-destructive" />
                Suspended Users
                <Badge variant="secondary" className="ml-2">
                  {filteredUsers.length} users
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">User</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[150px]">Remaining Time</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="w-[180px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((suspendedUser) => {
                        const remaining = getRemainingTime(
                          suspendedUser.suspended_until,
                          suspendedUser.is_active
                        );

                        return (
                          <TableRow key={suspendedUser.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-destructive/10 text-destructive text-sm">
                                    {getInitials(suspendedUser.email, suspendedUser.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {suspendedUser.full_name || "No name"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {suspendedUser.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {suspendedUser.is_active ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-500/10 text-amber-600 border-amber-200"
                                >
                                  <Timer className="w-3 h-3 mr-1" />
                                  Temporary
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-red-500/10 text-red-600 border-red-200"
                                >
                                  <Ban className="w-3 h-3 mr-1" />
                                  Permanent
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {remaining && (
                                <div className="flex items-center gap-2">
                                  <Clock className={`w-4 h-4 ${remaining.color}`} />
                                  <span
                                    className={`text-sm font-mono ${remaining.color} ${
                                      remaining.urgent ? "animate-pulse" : ""
                                    }`}
                                  >
                                    {remaining.text}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {suspendedUser.suspension_reason || "No reason provided"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(suspendedUser)}
                                  className="gap-1"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleLiftClick(suspendedUser)}
                                  className="gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Lift
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No suspended users
                  </h3>
                  <p className="text-muted-foreground">
                    All users are currently active
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Lift Suspension Dialog */}
      <Dialog open={liftDialogOpen} onOpenChange={setLiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              Lift Suspension
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to lift the suspension for{" "}
              <span className="font-medium text-foreground">
                {selectedUser?.email}
              </span>
              ? They will regain full access immediately.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Status:{" "}
                  {selectedUser.is_active ? "Temporarily suspended" : "Permanently blocked"}
                </span>
              </div>
              {selectedUser.suspension_reason && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>Reason: {selectedUser.suspension_reason}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLiftDialogOpen(false)}
              disabled={liftSuspensionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && liftSuspensionMutation.mutate(selectedUser.id)}
              disabled={liftSuspensionMutation.isPending}
              className="gap-2"
            >
              {liftSuspensionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lifting...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Confirm Lift
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Suspension Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Suspension
            </DialogTitle>
            <DialogDescription>
              Modify the suspension for{" "}
              <span className="font-medium text-foreground">
                {selectedUser?.email}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-duration" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                New Duration
              </Label>
              <Select
                value={newDuration}
                onValueChange={(v) => setNewDuration(v as SuspensionDuration)}
              >
                <SelectTrigger id="edit-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {SUSPENSION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reason">Reason</Label>
              <Textarea
                id="edit-reason"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSuspensionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedUser &&
                editSuspensionMutation.mutate({
                  userId: selectedUser.id,
                  duration: newDuration,
                  reason: newReason,
                })
              }
              disabled={editSuspensionMutation.isPending}
              className="gap-2"
            >
              {editSuspensionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Update Suspension
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuspendedUsers;
