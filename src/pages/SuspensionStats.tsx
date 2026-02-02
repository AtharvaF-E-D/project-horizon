import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useSuspensionStats } from "@/hooks/useSuspensionStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  UserX,
  TrendingUp,
  Clock,
  Ban,
  UserCheck,
  BarChart3,
  PieChartIcon,
  Timer,
  Users,
  Activity,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const chartConfig = {
  suspended: {
    label: "Suspended",
    color: "hsl(var(--chart-1))",
  },
  modified: {
    label: "Modified",
    color: "hsl(var(--chart-2))",
  },
  lifted: {
    label: "Lifted",
    color: "hsl(var(--chart-3))",
  },
  blocked: {
    label: "Blocked",
    color: "hsl(var(--chart-4))",
  },
};

const formatDuration = (hours: number): string => {
  if (hours < 1) return "< 1 hour";
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
};

const SuspensionStats = () => {
  const { user } = useAuth();
  const { permissions, loading: rolesLoading } = useUserRole();
  const [timeRange, setTimeRange] = useState<string>("30");
  const { stats, isLoading } = useSuspensionStats(parseInt(timeRange));

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary" />
                Suspension Statistics
              </h1>
              <p className="text-muted-foreground">
                Analyze suspension trends, patterns, and durations
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" asChild>
                <Link to="/suspended-users">
                  <UserX className="w-4 h-4 mr-2" />
                  Manage Users
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold">{stats.activeNow}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Active Now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <UserX className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold">{stats.totalSuspensions}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Suspensions</p>
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
                    {isLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold">{stats.totalBlocks}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Permanent Blocks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold">{stats.totalLifted}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Lifted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold">{stats.totalModified}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Modified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trends" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="reasons" className="gap-2">
                <PieChartIcon className="w-4 h-4" />
                Reasons
              </TabsTrigger>
              <TabsTrigger value="duration" className="gap-2">
                <Timer className="w-4 h-4" />
                Duration
              </TabsTrigger>
              <TabsTrigger value="performers" className="gap-2">
                <Users className="w-4 h-4" />
                Admins
              </TabsTrigger>
            </TabsList>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Suspension Activity Over Time</CardTitle>
                  <CardDescription>
                    Daily breakdown of suspension actions over the last {timeRange} days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[350px] w-full" />
                  ) : stats.trends.length === 0 ? (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                      No suspension data available for this period
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <AreaChart data={stats.trends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Area
                          type="monotone"
                          dataKey="suspended"
                          stackId="1"
                          stroke="var(--color-suspended)"
                          fill="var(--color-suspended)"
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="blocked"
                          stackId="1"
                          stroke="var(--color-blocked)"
                          fill="var(--color-blocked)"
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="modified"
                          stackId="1"
                          stroke="var(--color-modified)"
                          fill="var(--color-modified)"
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="lifted"
                          stackId="1"
                          stroke="var(--color-lifted)"
                          fill="var(--color-lifted)"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reasons Tab */}
            <TabsContent value="reasons" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Suspension Reasons Distribution</CardTitle>
                    <CardDescription>
                      Most common reasons for suspensions and blocks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : stats.reasonBreakdown.length === 0 ? (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No suspension data available
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.reasonBreakdown}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="count"
                              nameKey="reason"
                              label={({ percentage }) => `${percentage}%`}
                            >
                              {stats.reasonBreakdown.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Suspension Reasons</CardTitle>
                    <CardDescription>Ranked list of suspension reasons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : stats.reasonBreakdown.length === 0 ? (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No reasons recorded
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats.reasonBreakdown.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="text-sm font-medium">{item.reason}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{item.count}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Duration Tab */}
            <TabsContent value="duration" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                      {isLoading ? (
                        <Skeleton className="h-8 w-24 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">
                          {formatDuration(stats.durationStats.averageHours)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">Average Duration</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Timer className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                      {isLoading ? (
                        <Skeleton className="h-8 w-24 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">
                          {formatDuration(stats.durationStats.medianHours)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">Median Duration</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      {isLoading ? (
                        <Skeleton className="h-8 w-24 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">
                          {formatDuration(stats.durationStats.shortestHours)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">Shortest</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Ban className="w-8 h-8 mx-auto mb-2 text-destructive" />
                      {isLoading ? (
                        <Skeleton className="h-8 w-24 mx-auto" />
                      ) : (
                        <p className="text-2xl font-bold">
                          {formatDuration(stats.durationStats.longestHours)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">Longest</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Suspension Type Distribution</CardTitle>
                  <CardDescription>
                    Comparison of temporary vs permanent suspensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Temporary", count: stats.durationStats.temporaryCount },
                            { name: "Permanent", count: stats.durationStats.permanentCount },
                          ]}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} />
                          <ChartTooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performers Tab */}
            <TabsContent value="performers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Admins by Suspension Actions</CardTitle>
                  <CardDescription>
                    Admins who have performed the most suspension-related actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : stats.topPerformers.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No admin activity recorded
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.topPerformers.map((performer, index) => (
                        <div
                          key={performer.email}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium">{performer.email}</span>
                          </div>
                          <Badge variant="outline" className="text-lg px-4 py-1">
                            {performer.count} actions
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default SuspensionStats;
