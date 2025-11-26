import { useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar, Download } from "lucide-react";

const salesData = [
  { month: "Jan", revenue: 45000, leads: 120, conversions: 34 },
  { month: "Feb", revenue: 52000, leads: 145, conversions: 42 },
  { month: "Mar", revenue: 48000, leads: 135, conversions: 38 },
  { month: "Apr", revenue: 61000, leads: 168, conversions: 48 },
  { month: "May", revenue: 58000, leads: 152, conversions: 45 },
  { month: "Jun", revenue: 67000, leads: 180, conversions: 54 },
];

const pipelineData = [
  { stage: "New Leads", count: 45, value: 225000 },
  { stage: "Contacted", count: 32, value: 160000 },
  { stage: "Qualified", count: 24, value: 120000 },
  { stage: "Proposal", count: 18, value: 90000 },
  { stage: "Negotiation", count: 12, value: 60000 },
  { stage: "Closed Won", count: 8, value: 40000 },
];

const topPerformers = [
  { name: "Sales Rep A", deals: 28, revenue: 145000, conversion: 32 },
  { name: "Sales Rep B", deals: 24, revenue: 132000, conversion: 28 },
  { name: "Sales Rep C", deals: 21, revenue: 118000, conversion: 25 },
  { name: "Sales Rep D", deals: 19, revenue: 105000, conversion: 23 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-30-days");

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Reports & Analytics
              </h1>
              <p className="text-muted-foreground mt-2">
                Track performance and gain insights into your sales
              </p>
            </div>
            <div className="flex gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="this-year">This year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$331,000</div>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15.3% from last period
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">900</div>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.8% from last period
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">29.1%</div>
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3.2% from last period
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$5,183</div>
                <div className="flex items-center text-xs text-red-500 mt-1">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -2.4% from last period
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Data */}
          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList>
              <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
              <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
              <TabsTrigger value="performance">Team Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Over Time</CardTitle>
                  <CardDescription>Monthly revenue, leads, and conversion tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-end justify-between gap-4">
                    {salesData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-primary/20 rounded-t-lg relative" style={{ height: `${(data.revenue / 70000) * 100}%` }}>
                          <div className="absolute -top-8 left-0 right-0 text-center">
                            <p className="text-sm font-semibold">${(data.revenue / 1000).toFixed(0)}k</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{data.month}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>{data.leads} leads</p>
                          <p>{data.conversions} deals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { source: "Inbound Leads", value: 145000, percentage: 44 },
                        { source: "Outbound Calls", value: 98000, percentage: 30 },
                        { source: "Referrals", value: 65000, percentage: 20 },
                        { source: "Other", value: 23000, percentage: 6 },
                      ].map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{item.source}</span>
                            <span className="font-semibold">${(item.value / 1000).toFixed(0)}k ({item.percentage}%)</span>
                          </div>
                          <div className="h-2 bg-accent rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Targets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Revenue Goal</span>
                          <span className="font-semibold">$67k / $80k</span>
                        </div>
                        <div className="h-3 bg-accent rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: "84%" }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">84% of monthly goal</p>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Deals Closed</span>
                          <span className="font-semibold">54 / 60</span>
                        </div>
                        <div className="h-3 bg-accent rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: "90%" }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">90% of monthly goal</p>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>New Leads</span>
                          <span className="font-semibold">180 / 200</span>
                        </div>
                        <div className="h-3 bg-accent rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: "90%" }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">90% of monthly goal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Funnel</CardTitle>
                  <CardDescription>Conversion rates at each stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pipelineData.map((stage, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{stage.stage}</span>
                          <div className="text-right">
                            <p className="font-semibold">{stage.count} deals</p>
                            <p className="text-sm text-muted-foreground">${(stage.value / 1000).toFixed(0)}k</p>
                          </div>
                        </div>
                        <div className="h-12 bg-gradient-primary rounded-lg flex items-center px-4 text-white font-semibold"
                             style={{ width: `${(stage.count / 45) * 100}%` }}>
                          {((stage.count / 45) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Team members ranked by performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.map((performer, index) => (
                      <Card key={index} className="hover-scale">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                #{index + 1}
                              </div>
                              <div>
                                <p className="font-semibold">{performer.name}</p>
                                <p className="text-sm text-muted-foreground">{performer.deals} deals closed</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">${(performer.revenue / 1000).toFixed(0)}k</p>
                              <p className="text-sm text-muted-foreground">{performer.conversion}% conversion</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
