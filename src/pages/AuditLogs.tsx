import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Activity, 
  UserPlus, 
  TrendingUp, 
  CheckSquare, 
  Building2, 
  Users,
  DollarSign,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Filter,
  Download,
  Search,
  Clock,
  Shield,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday, subDays, startOfDay, endOfDay } from "date-fns";
import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";

type ActivityType = 
  | 'lead_created' | 'lead_updated' | 'lead_status_changed' | 'lead_converted'
  | 'deal_created' | 'deal_updated' | 'deal_stage_changed' | 'deal_won' | 'deal_lost'
  | 'task_created' | 'task_completed' | 'task_updated'
  | 'contact_created' | 'contact_updated'
  | 'company_created' | 'company_updated'
  | 'note_added' | 'email_sent' | 'call_made' | 'meeting_scheduled';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: Profile;
}

const activityIcons: Record<string, React.ElementType> = {
  lead: UserPlus,
  deal: DollarSign,
  task: CheckSquare,
  contact: Users,
  company: Building2,
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: MessageSquare,
};

const activityColors: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  updated: "bg-blue-500/10 text-blue-600 border-blue-200",
  deleted: "bg-red-500/10 text-red-600 border-red-200",
  status_changed: "bg-amber-500/10 text-amber-600 border-amber-200",
  stage_changed: "bg-amber-500/10 text-amber-600 border-amber-200",
  converted: "bg-purple-500/10 text-purple-600 border-purple-200",
  won: "bg-green-500/10 text-green-600 border-green-200",
  lost: "bg-red-500/10 text-red-600 border-red-200",
  completed: "bg-green-500/10 text-green-600 border-green-200",
  sent: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  made: "bg-teal-500/10 text-teal-600 border-teal-200",
  scheduled: "bg-pink-500/10 text-pink-600 border-pink-200",
  added: "bg-slate-500/10 text-slate-600 border-slate-200",
};

const getActionColor = (activityType: string): string => {
  const action = activityType.split('_').pop() || '';
  return activityColors[action] || "bg-muted text-muted-foreground border-border";
};

const getEntityPath = (entityType: string, entityId: string): string => {
  const paths: Record<string, string> = {
    lead: `/leads/${entityId}`,
    deal: `/deals/${entityId}`,
    task: `/tasks/${entityId}`,
    contact: `/contacts/${entityId}`,
    company: `/companies/${entityId}`,
  };
  return paths[entityType] || "#";
};

const getActivityIcon = (activityType: ActivityType, entityType: string) => {
  if (activityType.includes("email")) return activityIcons.email;
  if (activityType.includes("call")) return activityIcons.call;
  if (activityType.includes("meeting")) return activityIcons.meeting;
  if (activityType.includes("note")) return activityIcons.note;
  return activityIcons[entityType] || Activity;
};

const formatActivityDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return format(date, "MMM d, yyyy 'at' h:mm:ss a");
};

const formatAction = (activityType: string): string => {
  return activityType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const AuditLogs = () => {
  const { user } = useAuth();
  const { permissions, loading: rolesLoading } = useUserRole();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch all profiles for user attribution
  const { data: profiles } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user,
  });

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles?.forEach(p => map.set(p.id, p));
    return map;
  }, [profiles]);

  // Fetch activities with date range filter
  const { data: activities, isLoading } = useQuery({
    queryKey: ["audit-logs", user?.id, filterType, filterAction, dateRange],
    queryFn: async () => {
      const startDate = dateRange === "all" 
        ? new Date('2020-01-01') 
        : startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      let query = supabase
        .from("activities")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (filterType !== "all") {
        query = query.eq("entity_type", filterType);
      }

      if (filterAction !== "all") {
        query = query.ilike("activity_type", `%${filterAction}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityItem[];
    },
    enabled: !!user,
  });

  // Filter activities by search query
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (!searchQuery) return activities;
    
    const query = searchQuery.toLowerCase();
    return activities.filter(activity => 
      activity.title.toLowerCase().includes(query) ||
      activity.description?.toLowerCase().includes(query) ||
      activity.entity_name?.toLowerCase().includes(query) ||
      profileMap.get(activity.user_id)?.full_name?.toLowerCase().includes(query) ||
      profileMap.get(activity.user_id)?.email?.toLowerCase().includes(query)
    );
  }, [activities, searchQuery, profileMap]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredActivities.length) return;
    
    const headers = ["Timestamp", "User", "Email", "Action", "Entity Type", "Entity Name", "Description"];
    const rows = filteredActivities.map(activity => {
      const profile = profileMap.get(activity.user_id);
      return [
        format(new Date(activity.created_at), "yyyy-MM-dd HH:mm:ss"),
        profile?.full_name || "Unknown",
        profile?.email || "Unknown",
        formatAction(activity.activity_type),
        activity.entity_type,
        activity.entity_name || "",
        activity.description || ""
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Stats
  const stats = useMemo(() => {
    if (!filteredActivities) return { total: 0, today: 0, uniqueUsers: 0, entities: 0 };
    
    const todayActivities = filteredActivities.filter(a => isToday(new Date(a.created_at)));
    const uniqueUsers = new Set(filteredActivities.map(a => a.user_id)).size;
    const uniqueEntities = new Set(filteredActivities.map(a => a.entity_id)).size;
    
    return {
      total: filteredActivities.length,
      today: todayActivities.length,
      uniqueUsers,
      entities: uniqueEntities
    };
  }, [filteredActivities]);

  if (rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Only admin/owner can view audit logs
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Audit Logs
              </h1>
              <p className="text-muted-foreground">Detailed logs of who did what and when</p>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.today}</p>
                    <p className="text-sm text-muted-foreground">Today's Activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.entities}</p>
                    <p className="text-sm text-muted-foreground">Entities Modified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                    <SelectItem value="deal">Deals</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                    <SelectItem value="contact">Contacts</SelectItem>
                    <SelectItem value="company">Companies</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="updated">Updated</SelectItem>
                    <SelectItem value="status">Status Changed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Activity Log
                <Badge variant="secondary" className="ml-2">{filteredActivities.length} entries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivities.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead className="w-[200px]">User</TableHead>
                        <TableHead className="w-[150px]">Action</TableHead>
                        <TableHead className="w-[120px]">Entity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivities.map((activity) => {
                        const Icon = getActivityIcon(activity.activity_type, activity.entity_type);
                        const profile = profileMap.get(activity.user_id);
                        const actionColorClass = getActionColor(activity.activity_type);
                        
                        return (
                          <TableRow key={activity.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{format(new Date(activity.created_at), "MMM d, yyyy")}</span>
                                <span>{format(new Date(activity.created_at), "HH:mm:ss")}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={profile?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {profile?.full_name || "Unknown User"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {profile?.email || "No email"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${actionColorClass} text-xs`}>
                                <Icon className="w-3 h-3 mr-1" />
                                {formatAction(activity.activity_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize text-xs">
                                {activity.entity_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{activity.title}</p>
                                {activity.entity_name && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {activity.entity_name}
                                  </p>
                                )}
                                {activity.description && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {activity.entity_id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-8 w-8 p-0"
                                >
                                  <Link to={getEntityPath(activity.entity_type, activity.entity_id)}>
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No logs found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Try adjusting your search or filters"
                      : "Activities will appear here as users interact with the system"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AuditLogs;
