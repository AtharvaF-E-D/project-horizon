import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { DollarSign, TrendingUp, Users, Building2, Target, CheckCircle2, Clock, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPipeline: 0,
    wonRevenue: 0,
    contactsCount: 0,
    companiesCount: 0,
    leadsCount: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    conversionRate: 0,
  });
  const [dealsOverTime, setDealsOverTime] = useState<any[]>([]);
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<any[]>([]);
  const [leadsByStatus, setLeadsByStatus] = useState<any[]>([]);
  const [tasksByPriority, setTasksByPriority] = useState<any[]>([]);
  const [leadsOverTime, setLeadsOverTime] = useState<any[]>([]);

  const CHART_COLORS = {
    primary: "hsl(174, 100%, 39%)",
    secondary: "hsl(262, 47%, 55%)",
    accent: "hsl(45, 100%, 65%)",
    success: "hsl(142, 71%, 45%)",
    warning: "hsl(38, 92%, 50%)",
    danger: "hsl(0, 84%, 60%)",
  };

  const PIE_COLORS = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.accent,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
  ];

  useEffect(() => {
    if (user) {
      fetchAllAnalytics();
    }
  }, [user]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDealsAnalytics(),
        fetchLeadsAnalytics(),
        fetchTasksAnalytics(),
        fetchCounts(),
      ]);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealsAnalytics = async () => {
    const { data: deals } = await supabase.from("deals").select("*");
    if (!deals) return;

    const totalPipeline = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const wonRevenue = deals
      .filter((d) => d.stage === "closed_won")
      .reduce((sum, deal) => sum + (deal.value || 0), 0);

    setMetrics((prev) => ({ ...prev, totalPipeline, wonRevenue }));

    // Deals by stage
    const stageLabels: Record<string, string> = {
      prospecting: "Prospecting",
      qualification: "Qualification",
      proposal: "Proposal",
      negotiation: "Negotiation",
      closed_won: "Won",
      closed_lost: "Lost",
    };
    const stageCount = deals.reduce((acc: Record<string, number>, deal) => {
      const stage = deal.stage || "prospecting";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    setDealsByStage(
      Object.entries(stageCount).map(([key, value]) => ({
        name: stageLabels[key] || key,
        value,
      }))
    );

    // Deals over time (last 6 months)
    const monthlyDeals = deals.reduce((acc: Record<string, number>, deal) => {
      const month = new Date(deal.created_at).toLocaleDateString("en-US", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + (deal.value || 0);
      return acc;
    }, {});
    setDealsOverTime(
      Object.entries(monthlyDeals)
        .slice(-6)
        .map(([month, value]) => ({ month, value }))
    );
  };

  const fetchLeadsAnalytics = async () => {
    const { data: leads } = await supabase.from("leads").select("*");
    if (!leads) return;

    setMetrics((prev) => ({ ...prev, leadsCount: leads.length }));

    // Calculate conversion rate (qualified + converted / total)
    const converted = leads.filter((l) => l.status === "converted").length;
    const conversionRate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;
    setMetrics((prev) => ({ ...prev, conversionRate }));

    // Leads by source
    const sourceLabels: Record<string, string> = {
      website: "Website",
      referral: "Referral",
      social_media: "Social Media",
      email_campaign: "Email Campaign",
      cold_call: "Cold Call",
      event: "Event",
      other: "Other",
    };
    const sourceCount = leads.reduce((acc: Record<string, number>, lead) => {
      const source = lead.source || "other";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    setLeadsBySource(
      Object.entries(sourceCount).map(([key, value]) => ({
        name: sourceLabels[key] || key,
        value,
      }))
    );

    // Leads by status
    const statusLabels: Record<string, string> = {
      new: "New",
      contacted: "Contacted",
      qualified: "Qualified",
      unqualified: "Unqualified",
      converted: "Converted",
    };
    const statusCount = leads.reduce((acc: Record<string, number>, lead) => {
      const status = lead.status || "new";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    setLeadsByStatus(
      Object.entries(statusCount).map(([key, value]) => ({
        name: statusLabels[key] || key,
        value,
      }))
    );

    // Leads over time (last 6 months)
    const monthlyLeads = leads.reduce((acc: Record<string, number>, lead) => {
      const month = new Date(lead.created_at || "").toLocaleDateString("en-US", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    setLeadsOverTime(
      Object.entries(monthlyLeads)
        .slice(-6)
        .map(([month, count]) => ({ month, count }))
    );
  };

  const fetchTasksAnalytics = async () => {
    const { data: tasks } = await supabase.from("tasks").select("*");
    if (!tasks) return;

    const completed = tasks.filter((t) => t.status === "completed").length;
    setMetrics((prev) => ({
      ...prev,
      tasksCompleted: completed,
      totalTasks: tasks.length,
    }));

    // Tasks by priority
    const priorityLabels: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    };
    const priorityCount = tasks.reduce((acc: Record<string, number>, task) => {
      const priority = task.priority || "medium";
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    setTasksByPriority(
      Object.entries(priorityCount).map(([key, value]) => ({
        name: priorityLabels[key] || key,
        value,
      }))
    );
  };

  const fetchCounts = async () => {
    const [contactsRes, companiesRes] = await Promise.all([
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase.from("companies").select("*", { count: "exact", head: true }),
    ]);
    setMetrics((prev) => ({
      ...prev,
      contactsCount: contactsRes.count || 0,
      companiesCount: companiesRes.count || 0,
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: {typeof entry.value === "number" && entry.value >= 1000
                ? `$${entry.value.toLocaleString()}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8 ml-64 pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track your sales performance and team metrics
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pipeline</p>
                    <p className="text-2xl font-bold">
                      ${metrics.totalPipeline.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue Won</p>
                    <p className="text-2xl font-bold">
                      ${metrics.wonRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl gradient-secondary flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold">{metrics.leadsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                    <Target className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Contacts</p>
                  <p className="text-lg font-semibold">{metrics.contactsCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-xs text-muted-foreground">Companies</p>
                  <p className="text-lg font-semibold">{metrics.companiesCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                  <p className="text-lg font-semibold">
                    {metrics.tasksCompleted}/{metrics.totalTasks}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                  <p className="text-lg font-semibold">
                    {metrics.totalTasks > 0
                      ? Math.round((metrics.tasksCompleted / metrics.totalTasks) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Tabs */}
          <Tabs defaultValue="deals" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="deals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deal Value Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dealsOverTime}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={CHART_COLORS.primary}
                          fill="url(#colorValue)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deals by Stage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dealsByStage}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {dealsByStage.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Leads by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={leadsBySource} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill={CHART_COLORS.secondary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Leads by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={leadsByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {leadsByStatus.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Generation Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={leadsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={CHART_COLORS.primary}
                          strokeWidth={3}
                          dot={{ fill: CHART_COLORS.primary, r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tasks by Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={tasksByPriority}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {tasksByPriority.map((entry, index) => {
                            const colors: Record<string, string> = {
                              Low: CHART_COLORS.success,
                              Medium: CHART_COLORS.accent,
                              High: CHART_COLORS.warning,
                              Urgent: CHART_COLORS.danger,
                            };
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={colors[entry.name] || CHART_COLORS.primary}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Completion Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Completed", value: metrics.tasksCompleted },
                            { name: "Pending", value: metrics.totalTasks - metrics.tasksCompleted },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell fill={CHART_COLORS.success} />
                          <Cell fill={CHART_COLORS.secondary} />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Analytics;
