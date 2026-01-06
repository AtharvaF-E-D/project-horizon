import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Users, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Analytics = () => {
  const { user } = useAuth();
  const [dealsData, setDealsData] = useState<any[]>([]);
  const [stageData, setStageData] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [wonValue, setWonValue] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch deals
      const { data: deals, error: dealsError } = await supabase
        .from("deals")
        .select("*");

      if (dealsError) throw dealsError;

      // Calculate metrics
      const total = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
      const won = deals?.filter(d => d.stage === "closed_won")
        .reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

      setTotalValue(total);
      setWonValue(won);

      // Stage distribution
      const stageCount = deals?.reduce((acc: any, deal) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + 1;
        return acc;
      }, {});

      const stageChartData = Object.entries(stageCount || {}).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
      }));

      setStageData(stageChartData);

      // Monthly deals (last 6 months)
      const monthlyData = deals?.reduce((acc: any, deal) => {
        const month = new Date(deal.created_at).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        acc[month] = (acc[month] || 0) + (deal.value || 0);
        return acc;
      }, {});

      const dealsChartData = Object.entries(monthlyData || {})
        .slice(-6)
        .map(([month, value]) => ({
          month,
          value,
        }));

      setDealsData(dealsChartData);

      // Fetch counts
      const { count: contactsTotal } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true });

      const { count: companiesTotal } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      setContactsCount(contactsTotal || 0);
      setCompaniesCount(companiesTotal || 0);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8 ml-64 pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your sales performance</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pipeline</p>
                  <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Won</p>
                  <p className="text-2xl font-bold">${wonValue.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold">{contactsCount}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Companies</p>
                  <p className="text-2xl font-bold">{companiesCount}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Deal Value Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dealsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Deals by Stage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Deal Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Analytics;
