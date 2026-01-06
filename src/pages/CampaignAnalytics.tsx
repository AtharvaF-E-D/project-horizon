import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Mail,
  Eye,
  MousePointer,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Campaign {
  id: string;
  name: string;
  status: string;
  campaign_type: string;
  sent_at: string | null;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
}

interface AnalyticsEvent {
  id: string;
  campaign_id: string;
  event_type: string;
  created_at: string;
  subscriber_id: string | null;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const CampaignAnalytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);
  const [dateRange, setDateRange] = useState("30");
  const [selectedCampaign, setSelectedCampaign] = useState("all");

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));

      const [campaignsRes, analyticsRes] = await Promise.all([
        supabase
          .from("campaigns")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("campaign_analytics")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false }),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (analyticsRes.error) throw analyticsRes.error;

      setCampaigns(campaignsRes.data || []);
      setAnalytics(analyticsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter campaigns based on selection
  const filteredCampaigns = selectedCampaign === "all" 
    ? campaigns 
    : campaigns.filter(c => c.id === selectedCampaign);

  const filteredAnalytics = selectedCampaign === "all"
    ? analytics
    : analytics.filter(a => a.campaign_id === selectedCampaign);

  // Calculate aggregate metrics
  const totalRecipients = filteredCampaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0);
  const totalOpens = filteredCampaigns.reduce((sum, c) => sum + (c.open_count || 0), 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + (c.click_count || 0), 0);
  const sentCampaigns = filteredCampaigns.filter(c => c.status === "sent").length;
  
  const openRate = totalRecipients > 0 ? ((totalOpens / totalRecipients) * 100).toFixed(1) : "0";
  const clickRate = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : "0";
  const clickThroughRate = totalRecipients > 0 ? ((totalClicks / totalRecipients) * 100).toFixed(1) : "0";

  // Prepare chart data - Daily engagement trends
  const dailyData = Array.from({ length: Math.min(parseInt(dateRange), 30) }, (_, i) => {
    const date = subDays(new Date(), parseInt(dateRange) - 1 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const displayDate = format(date, "MMM d");

    const dayAnalytics = filteredAnalytics.filter(
      a => format(new Date(a.created_at), "yyyy-MM-dd") === dateStr
    );

    return {
      date: displayDate,
      opens: dayAnalytics.filter(a => a.event_type === "open").length,
      clicks: dayAnalytics.filter(a => a.event_type === "click").length,
      delivered: dayAnalytics.filter(a => a.event_type === "delivered").length,
    };
  });

  // Campaign performance comparison
  const campaignPerformance = filteredCampaigns
    .filter(c => c.status === "sent")
    .slice(0, 10)
    .map(c => ({
      name: c.name.length > 20 ? c.name.slice(0, 20) + "..." : c.name,
      openRate: c.recipient_count > 0 ? ((c.open_count / c.recipient_count) * 100) : 0,
      clickRate: c.open_count > 0 ? ((c.click_count / c.open_count) * 100) : 0,
      recipients: c.recipient_count,
    }));

  // Engagement breakdown pie chart
  const engagementBreakdown = [
    { name: "Opened & Clicked", value: totalClicks, color: PIE_COLORS[0] },
    { name: "Opened Only", value: Math.max(0, totalOpens - totalClicks), color: PIE_COLORS[1] },
    { name: "Not Opened", value: Math.max(0, totalRecipients - totalOpens), color: PIE_COLORS[3] },
  ].filter(item => item.value > 0);

  // Event type distribution
  const eventTypeData = [
    { type: "Opens", count: filteredAnalytics.filter(a => a.event_type === "open").length },
    { type: "Clicks", count: filteredAnalytics.filter(a => a.event_type === "click").length },
    { type: "Delivered", count: filteredAnalytics.filter(a => a.event_type === "delivered").length },
    { type: "Bounced", count: filteredAnalytics.filter(a => a.event_type === "bounce").length },
    { type: "Unsubscribed", count: filteredAnalytics.filter(a => a.event_type === "unsubscribe").length },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <DashboardNav />
        <main className="ml-64 pt-16 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />

      <main className="ml-64 pt-16 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2">Campaign Analytics</h1>
              <p className="text-muted-foreground">
                Track email performance, engagement, and subscriber behavior
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name.length > 25 ? c.name.slice(0, 25) + "..." : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-36">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary">{sentCampaigns} sent</Badge>
              </div>
              <div className="text-2xl font-bold">{filteredCampaigns.length}</div>
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl font-bold">{totalRecipients.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Recipients</div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Eye className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {openRate}%
                </div>
              </div>
              <div className="text-2xl font-bold">{totalOpens.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Opens</div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MousePointer className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex items-center text-purple-500 text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {clickRate}%
                </div>
              </div>
              <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Clicks</div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                </div>
              </div>
              <div className="text-2xl font-bold">{clickThroughRate}%</div>
              <div className="text-sm text-muted-foreground">Click-Through Rate</div>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="engagement" className="space-y-6">
            <TabsList>
              <TabsTrigger value="engagement">Engagement Trends</TabsTrigger>
              <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
              <TabsTrigger value="breakdown">Engagement Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2 p-6">
                  <h3 className="font-semibold mb-4">Daily Engagement Trends</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyData}>
                        <defs>
                          <linearGradient id="opensGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="opens"
                          name="Opens"
                          stroke="#22c55e"
                          fill="url(#opensGradient)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          name="Clicks"
                          stroke="#8b5cf6"
                          fill="url(#clicksGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Event Breakdown</h3>
                  <div className="space-y-4">
                    {eventTypeData.map((event, index) => (
                      <div key={event.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          <span className="text-sm">{event.type}</span>
                        </div>
                        <span className="font-medium">{event.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Campaign Performance Comparison</h3>
                {campaignPerformance.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sent campaigns to compare</p>
                    <Button variant="link" onClick={() => navigate("/campaigns/new")}>
                      Create your first campaign
                    </Button>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={campaignPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11} 
                          width={120}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="openRate" name="Open Rate %" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="clickRate" name="Click Rate %" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Top Campaigns Table */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Top Performing Campaigns</h3>
                <div className="space-y-3">
                  {filteredCampaigns
                    .filter(c => c.status === "sent")
                    .sort((a, b) => {
                      const aRate = a.recipient_count > 0 ? a.open_count / a.recipient_count : 0;
                      const bRate = b.recipient_count > 0 ? b.open_count / b.recipient_count : 0;
                      return bRate - aRate;
                    })
                    .slice(0, 5)
                    .map((campaign, index) => {
                      const oRate = campaign.recipient_count > 0 
                        ? ((campaign.open_count / campaign.recipient_count) * 100).toFixed(1) 
                        : "0";
                      const cRate = campaign.open_count > 0 
                        ? ((campaign.click_count / campaign.open_count) * 100).toFixed(1) 
                        : "0";

                      return (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {campaign.recipient_count} recipients • {campaign.sent_at && format(new Date(campaign.sent_at), "MMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-500">{oRate}% open</div>
                              <div className="text-sm text-muted-foreground">{cRate}% click</div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  {filteredCampaigns.filter(c => c.status === "sent").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No sent campaigns yet
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Subscriber Engagement</h3>
                  {engagementBreakdown.length === 0 || totalRecipients === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No engagement data available
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={engagementBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {engagementBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Key Metrics Summary</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Open Rate</span>
                        <span className="text-sm font-medium">{openRate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(parseFloat(openRate), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Click Rate (of opens)</span>
                        <span className="text-sm font-medium">{clickRate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(parseFloat(clickRate), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Click-Through Rate (CTR)</span>
                        <span className="text-sm font-medium">{clickThroughRate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(parseFloat(clickThroughRate), 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-3">Industry Benchmarks</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-muted-foreground">Avg Open Rate</div>
                          <div className="font-medium">21.5%</div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-muted-foreground">Avg Click Rate</div>
                          <div className="font-medium">2.6%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CampaignAnalytics;
