import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  Filter
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay } from "date-fns";
import { useState } from "react";
import { Link } from "react-router-dom";

type ActivityType = 
  | 'lead_created' | 'lead_updated' | 'lead_status_changed' | 'lead_converted'
  | 'deal_created' | 'deal_updated' | 'deal_stage_changed' | 'deal_won' | 'deal_lost'
  | 'task_created' | 'task_completed' | 'task_updated'
  | 'contact_created' | 'contact_updated'
  | 'company_created' | 'company_updated'
  | 'note_added' | 'email_sent' | 'call_made' | 'meeting_scheduled';

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
  lead_created: "bg-emerald-500",
  lead_updated: "bg-blue-500",
  lead_status_changed: "bg-amber-500",
  lead_converted: "bg-purple-500",
  deal_created: "bg-emerald-500",
  deal_updated: "bg-blue-500",
  deal_stage_changed: "bg-amber-500",
  deal_won: "bg-green-500",
  deal_lost: "bg-red-500",
  task_created: "bg-emerald-500",
  task_completed: "bg-green-500",
  task_updated: "bg-blue-500",
  contact_created: "bg-emerald-500",
  contact_updated: "bg-blue-500",
  company_created: "bg-emerald-500",
  company_updated: "bg-blue-500",
  note_added: "bg-slate-500",
  email_sent: "bg-indigo-500",
  call_made: "bg-teal-500",
  meeting_scheduled: "bg-pink-500",
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
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, yyyy 'at' h:mm a");
};

const groupActivitiesByDate = (activities: ActivityItem[]) => {
  const groups: { [key: string]: ActivityItem[] } = {};
  
  activities.forEach((activity) => {
    const date = startOfDay(new Date(activity.created_at));
    const key = isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMMM d, yyyy");
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
  });
  
  return groups;
};

const ActivityTimeline = () => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>("all");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", user?.id, filterType],
    queryFn: async () => {
      let query = supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterType !== "all") {
        query = query.eq("entity_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityItem[];
    },
    enabled: !!user,
  });

  const groupedActivities = activities ? groupActivitiesByDate(activities) : {};

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="pl-64 pt-16">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Activity Timeline</h1>
              <p className="text-muted-foreground">Track all activities across your CRM</p>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="deal">Deals</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="contact">Contacts</SelectItem>
                  <SelectItem value="company">Companies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedActivities).map(([dateGroup, groupActivities]) => (
                    <div key={dateGroup}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-4 sticky top-0 bg-card py-2">
                        {dateGroup}
                      </h3>
                      <div className="relative">
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                        <div className="space-y-4">
                          {groupActivities.map((activity) => {
                            const Icon = getActivityIcon(activity.activity_type, activity.entity_type);
                            const colorClass = activityColors[activity.activity_type] || "bg-slate-500";
                            
                            return (
                              <div key={activity.id} className="relative flex items-start gap-4 pl-2">
                                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${colorClass} text-white shadow-md`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0 pb-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-foreground">{activity.title}</p>
                                      {activity.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-xs capitalize">
                                          {activity.entity_type}
                                        </Badge>
                                        {activity.entity_name && (
                                          <Link 
                                            to={getEntityPath(activity.entity_type, activity.entity_id)}
                                            className="text-sm text-primary hover:underline"
                                          >
                                            {activity.entity_name}
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatActivityDate(activity.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No activities yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Activities will appear here as you interact with leads, deals, tasks, and more.
                  </p>
                  <Button asChild>
                    <Link to="/leads">Get Started with Leads</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ActivityTimeline;