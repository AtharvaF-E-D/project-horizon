import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { TrendingUp, Users, Target, DollarSign, Plus, Search, Mail, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalLeads: number;
  activeDeals: number;
  revenue: number;
  conversionRate: number;
}

interface RecentLead {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  status: string | null;
  score: number | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [leadsRes, dealsRes, wonDealsRes, convertedLeadsRes, recentLeadsRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("stage", "in", '("closed_won","closed_lost")'),
        supabase.from("deals").select("value").eq("user_id", user.id).eq("stage", "closed_won"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "converted"),
        supabase.from("leads").select("id, first_name, last_name, company, status, score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const totalLeads = leadsRes.count || 0;
      const activeDeals = dealsRes.count || 0;
      const revenue = wonDealsRes.data?.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0;
      const convertedLeads = convertedLeadsRes.count || 0;
      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      setStats({ totalLeads, activeDeals, revenue, conversionRate });
      setRecentLeads(recentLeadsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val}`;
  };

  const statCards = stats ? [
    { label: "Total Leads", value: stats.totalLeads.toLocaleString(), icon: Users, color: "text-primary" },
    { label: "Active Deals", value: String(stats.activeDeals), icon: Target, color: "text-secondary" },
    { label: "Revenue", value: formatCurrency(stats.revenue), icon: DollarSign, color: "text-accent" },
    { label: "Conversion", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-primary" },
  ] : [];

  const statusColor = (status: string | null) => {
    switch (status) {
      case "qualified": return "bg-red-100 text-red-700";
      case "contacted": return "bg-yellow-100 text-yellow-700";
      case "new": return "bg-blue-100 text-blue-700";
      case "converted": return "bg-green-100 text-green-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
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
              <Button className="gradient-primary text-primary-foreground" onClick={() => navigate('/leads/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6"><Skeleton className="h-20 w-full" /></Card>
              ))
            ) : (
              statCards.map((stat, index) => (
                <Card key={index} className="p-6 card-hover" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              ))
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-heading text-xl font-semibold mb-4">Recent Leads</h3>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
                ) : recentLeads.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No leads yet. Add your first lead!</p>
                ) : (
                  recentLeads.map((lead) => (
                    <div key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
                          {lead.first_name[0]}{lead.last_name[0]}
                        </div>
                        <div>
                          <div className="font-medium">{lead.first_name} {lead.last_name}</div>
                          <div className="text-sm text-muted-foreground">{lead.company || "—"}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor(lead.status)}`}>
                        {lead.status || "new"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-heading text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Add Lead", icon: Users, path: "/leads/new" },
                  { label: "Create Task", icon: Target, path: "/tasks" },
                  { label: "Send Email", icon: Mail, path: "/email-templates" },
                  { label: "View Reports", icon: BarChart3, path: "/reports" },
                ].map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-smooth"
                    onClick={() => navigate(action.path)}
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
