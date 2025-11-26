import { useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Plus, Send, Eye, Users, TrendingUp, Calendar, Search } from "lucide-react";

const templates = [
  { id: 1, name: "Welcome Email", category: "Onboarding", opens: "45%", clicks: "12%" },
  { id: 2, name: "Product Launch", category: "Marketing", opens: "38%", clicks: "9%" },
  { id: 3, name: "Follow-up", category: "Sales", opens: "52%", clicks: "18%" },
  { id: 4, name: "Newsletter", category: "Marketing", opens: "41%", clicks: "11%" },
];

const campaigns = [
  { id: 1, name: "Q4 Product Launch", status: "Active", sent: 1250, opens: 475, clicks: 112, date: "2024-01-15" },
  { id: 2, name: "Welcome Series", status: "Active", sent: 890, opens: 401, clicks: 89, date: "2024-01-14" },
  { id: 3, name: "Re-engagement", status: "Scheduled", sent: 0, opens: 0, clicks: 0, date: "2024-01-20" },
  { id: 4, name: "Holiday Sale", status: "Completed", sent: 2100, opens: 840, clicks: 252, date: "2024-01-10" },
];

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Scheduled": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Completed": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

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
                Email Campaigns
              </h1>
              <p className="text-muted-foreground mt-2">
                Create, manage and track your email marketing campaigns
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Send className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4,240</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42.3%</div>
                <p className="text-xs text-muted-foreground">+3.2% from last month</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.8%</div>
                <p className="text-xs text-muted-foreground">+1.4% from last month</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18,456</div>
                <p className="text-xs text-muted-foreground">+234 this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Campaigns List */}
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover-scale">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(campaign.date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Sent</p>
                          <p className="font-semibold text-lg">{campaign.sent}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Opens</p>
                          <p className="font-semibold text-lg">{campaign.opens}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.sent > 0 ? ((campaign.opens / campaign.sent) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clicks</p>
                          <p className="font-semibold text-lg">{campaign.clicks}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.sent > 0 ? ((campaign.clicks / campaign.sent) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Report
                        </Button>
                        {campaign.status === "Scheduled" && (
                          <Button size="sm">
                            <Send className="w-4 h-4 mr-2" />
                            Send Now
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="hover-scale">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">Avg. Open Rate</p>
                          <p className="font-semibold text-lg">{template.opens}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg. Click Rate</p>
                          <p className="font-semibold text-lg">{template.clicks}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Preview
                        </Button>
                        <Button size="sm" className="flex-1">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
