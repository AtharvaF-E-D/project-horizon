import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RATE_LIMIT_CONFIG, RateLimitAction } from "@/hooks/useRateLimiter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Shield, 
  Search, 
  Activity, 
  Users, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Settings,
  Gauge,
  TrendingUp,
  Ban
} from "lucide-react";
import { format, formatDistanceToNow, subMinutes } from "date-fns";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface RateLimitEntry {
  id: string;
  user_id: string;
  action_type: string;
  request_count: number;
  window_start: string;
  created_at: string;
}

interface UserRateLimitSummary {
  user: Profile;
  limits: {
    action_type: string;
    request_count: number;
    max_requests: number;
    window_minutes: number;
    window_start: string;
    percentage: number;
    isNearLimit: boolean;
    isExceeded: boolean;
  }[];
  totalRequests: number;
  mostActiveAction: string | null;
}

const ACTION_LABELS: Record<RateLimitAction, { label: string; icon: React.ReactNode; description: string }> = {
  role_change: { label: "Role Changes", icon: <Shield className="h-4 w-4" />, description: "Changing user roles" },
  data_export: { label: "Data Exports", icon: <TrendingUp className="h-4 w-4" />, description: "Exporting data from the system" },
  data_import: { label: "Data Imports", icon: <TrendingUp className="h-4 w-4" />, description: "Importing data into the system" },
  password_change: { label: "Password Changes", icon: <Settings className="h-4 w-4" />, description: "Changing user passwords" },
  login_attempt: { label: "Login Attempts", icon: <Activity className="h-4 w-4" />, description: "Attempting to log in" },
  team_invite: { label: "Team Invites", icon: <Users className="h-4 w-4" />, description: "Inviting team members" },
  settings_change: { label: "Settings Changes", icon: <Settings className="h-4 w-4" />, description: "Modifying system settings" },
};

const RateLimitDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: roleLoading, isAdmin } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<{ userId: string; userName: string; actionType: string } | null>(null);

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

  // Fetch all profiles
  const { data: profiles } = useQuery({
    queryKey: ["all-profiles-rate-limit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch rate limits
  const { data: rateLimits, isLoading } = useQuery({
    queryKey: ["rate-limits-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rate_limits")
        .select("*")
        .order("window_start", { ascending: false });
      if (error) throw error;
      return data as RateLimitEntry[];
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Reset rate limit mutation
  const resetRateLimitMutation = useMutation({
    mutationFn: async ({ userId, actionType }: { userId: string; actionType: string }) => {
      const { error } = await supabase
        .from("rate_limits")
        .delete()
        .eq("user_id", userId)
        .eq("action_type", actionType);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-limits-admin"] });
      toast({
        title: "Rate Limit Reset",
        description: "The rate limit has been reset successfully.",
      });
      setResetDialogOpen(false);
      setSelectedUserForReset(null);
    },
    onError: (error) => {
      console.error("Error resetting rate limit:", error);
      toast({
        title: "Error",
        description: "Failed to reset rate limit.",
        variant: "destructive",
      });
    },
  });

  // Process data into user summaries
  const userSummaries = useMemo((): UserRateLimitSummary[] => {
    if (!profiles || !rateLimits) return [];

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const userLimitsMap = new Map<string, RateLimitEntry[]>();

    // Group rate limits by user
    rateLimits.forEach(limit => {
      const existing = userLimitsMap.get(limit.user_id) || [];
      existing.push(limit);
      userLimitsMap.set(limit.user_id, existing);
    });

    // Create summaries for users with rate limit entries
    const summaries: UserRateLimitSummary[] = [];
    
    userLimitsMap.forEach((limits, userId) => {
      const profile = profileMap.get(userId);
      if (!profile) return;

      const processedLimits = limits.map(limit => {
        const config = RATE_LIMIT_CONFIG[limit.action_type as RateLimitAction];
        const maxRequests = config?.maxRequests || 10;
        const windowMinutes = config?.windowMinutes || 60;
        const windowStart = new Date(limit.window_start);
        const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60 * 1000);
        const isWindowActive = windowEnd > new Date();
        
        // Only count if window is still active
        const effectiveCount = isWindowActive ? limit.request_count : 0;
        const percentage = Math.min((effectiveCount / maxRequests) * 100, 100);
        
        return {
          action_type: limit.action_type,
          request_count: effectiveCount,
          max_requests: maxRequests,
          window_minutes: windowMinutes,
          window_start: limit.window_start,
          percentage,
          isNearLimit: percentage >= 80,
          isExceeded: effectiveCount >= maxRequests,
        };
      }).filter(l => l.request_count > 0);

      if (processedLimits.length > 0) {
        const totalRequests = processedLimits.reduce((sum, l) => sum + l.request_count, 0);
        const mostActive = processedLimits.reduce((max, l) => 
          l.request_count > (max?.request_count || 0) ? l : max, processedLimits[0]);

        summaries.push({
          user: profile,
          limits: processedLimits,
          totalRequests,
          mostActiveAction: mostActive?.action_type || null,
        });
      }
    });

    return summaries.sort((a, b) => b.totalRequests - a.totalRequests);
  }, [profiles, rateLimits]);

  // Filter summaries
  const filteredSummaries = useMemo(() => {
    return userSummaries.filter(summary => {
      const matchesSearch = !searchQuery || 
        summary.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summary.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAction = selectedAction === "all" || 
        summary.limits.some(l => l.action_type === selectedAction);
      
      return matchesSearch && matchesAction;
    });
  }, [userSummaries, searchQuery, selectedAction]);

  // Stats
  const stats = useMemo(() => {
    const usersNearLimit = userSummaries.filter(s => s.limits.some(l => l.isNearLimit)).length;
    const usersExceeded = userSummaries.filter(s => s.limits.some(l => l.isExceeded)).length;
    const totalActiveRequests = userSummaries.reduce((sum, s) => sum + s.totalRequests, 0);
    
    return {
      activeUsers: userSummaries.length,
      usersNearLimit,
      usersExceeded,
      totalActiveRequests,
    };
  }, [userSummaries]);

  const handleResetClick = (userId: string, userName: string, actionType: string) => {
    setSelectedUserForReset({ userId, userName, actionType });
    setResetDialogOpen(true);
  };

  const confirmReset = () => {
    if (selectedUserForReset) {
      resetRateLimitMutation.mutate({
        userId: selectedUserForReset.userId,
        actionType: selectedUserForReset.actionType,
      });
    }
  };

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
              <Gauge className="h-8 w-8 text-primary" />
              Rate Limit Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage rate limits across all users
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeUsers}</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.usersNearLimit}</p>
                    <p className="text-sm text-muted-foreground">Near Limit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <Ban className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.usersExceeded}</p>
                    <p className="text-sm text-muted-foreground">Rate Limited</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalActiveRequests}</p>
                    <p className="text-sm text-muted-foreground">Active Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rate Limit Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Rate Limit Configuration
              </CardTitle>
              <CardDescription>Current rate limit settings for all action types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(RATE_LIMIT_CONFIG) as RateLimitAction[]).map(action => {
                  const config = RATE_LIMIT_CONFIG[action];
                  const label = ACTION_LABELS[action];
                  return (
                    <div key={action} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {label.icon}
                        <span className="font-medium text-sm">{label.label}</span>
                      </div>
                      <div className="text-2xl font-bold">{config.maxRequests}</div>
                      <div className="text-xs text-muted-foreground">
                        requests per {config.windowMinutes} min
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* User Rate Limits Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    User Rate Limits
                  </CardTitle>
                  <CardDescription>
                    Real-time view of rate limit usage per user
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {(Object.keys(RATE_LIMIT_CONFIG) as RateLimitAction[]).map(action => (
                        <SelectItem key={action} value={action}>
                          {ACTION_LABELS[action].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSummaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active rate limits found</p>
                  <p className="text-sm">Rate limits will appear here when users make requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSummaries.map(summary => (
                    <div key={summary.user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={summary.user.avatar_url || undefined} />
                            <AvatarFallback>
                              {summary.user.full_name?.charAt(0) || summary.user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{summary.user.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{summary.user.email}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {summary.totalRequests} total requests
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {summary.limits.map(limit => {
                          const label = ACTION_LABELS[limit.action_type as RateLimitAction];
                          return (
                            <div 
                              key={limit.action_type} 
                              className={`p-3 rounded-lg border ${
                                limit.isExceeded 
                                  ? 'bg-destructive/10 border-destructive/30' 
                                  : limit.isNearLimit 
                                    ? 'bg-yellow-500/10 border-yellow-500/30' 
                                    : 'bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {label?.icon}
                                  <span className="text-sm font-medium">{label?.label || limit.action_type}</span>
                                </div>
                                {limit.isExceeded && (
                                  <Badge variant="destructive" className="text-xs">Exceeded</Badge>
                                )}
                                {!limit.isExceeded && limit.isNearLimit && (
                                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">Near Limit</Badge>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{limit.request_count} / {limit.max_requests}</span>
                                  <span className="text-muted-foreground">{limit.percentage.toFixed(0)}%</span>
                                </div>
                                <Progress value={limit.percentage} className="h-2" />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(limit.window_start), { addSuffix: true })}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => handleResetClick(
                                      summary.user.id, 
                                      summary.user.full_name || summary.user.email,
                                      limit.action_type
                                    )}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Reset
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Rate Limit</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the rate limit for {selectedUserForReset?.userName}?
              This will allow them to make more {ACTION_LABELS[selectedUserForReset?.actionType as RateLimitAction]?.label.toLowerCase() || 'requests'} immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmReset}
              disabled={resetRateLimitMutation.isPending}
            >
              {resetRateLimitMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Reset Limit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RateLimitDashboard;
