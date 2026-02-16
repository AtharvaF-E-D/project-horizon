import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { TrendingUp, Users, Target, DollarSign, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Dashboard = () => {
  const stats = [
    { label: "Total Leads", value: "1,234", change: "+12%", icon: Users, color: "text-primary" },
    { label: "Active Deals", value: "56", change: "+8%", icon: Target, color: "text-secondary" },
    { label: "Revenue", value: "$45.2K", change: "+23%", icon: DollarSign, color: "text-accent" },
    { label: "Conversion", value: "32%", change: "+5%", icon: TrendingUp, color: "text-primary" },
  ];

  const recentLeads = [
    { name: "Sarah Johnson", company: "TechCorp", status: "Hot", value: "$12.5K" },
    { name: "Mike Anderson", company: "StartupXYZ", status: "Warm", value: "$8.3K" },
    { name: "Emily Davis", company: "Enterprise Co", status: "Cold", value: "$25K" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="ml-64 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-10 w-full sm:w-64" />
              </div>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className="p-6 card-hover"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-heading text-xl font-semibold mb-4">Recent Leads</h3>
              <div className="space-y-4">
                {recentLeads.map((lead, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.company}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{lead.value}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        lead.status === 'Hot' ? 'bg-red-100 text-red-700' :
                        lead.status === 'Warm' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-heading text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Add Lead", icon: Users },
                  { label: "Create Task", icon: Target },
                  { label: "Send Email", icon: DollarSign },
                  { label: "View Reports", icon: TrendingUp },
                ].map((action, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-smooth"
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
