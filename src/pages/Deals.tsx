import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, DollarSign, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  close_date: string;
  companies: { name: string } | null;
  contacts: { first_name: string; last_name: string } | null;
}

const Deals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user]);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          companies(name),
          contacts(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter((deal) =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospecting: "bg-blue-500",
      qualification: "bg-purple-500",
      proposal: "bg-yellow-500",
      negotiation: "bg-orange-500",
      closed_won: "bg-green-500",
      closed_lost: "bg-red-500",
    };
    return colors[stage] || "bg-gray-500";
  };

  const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const wonDeals = filteredDeals.filter((d) => d.stage === "closed_won");
  const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8 ml-64">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Deals</h1>
              <p className="text-muted-foreground">Manage your sales opportunities</p>
            </div>
            <Button onClick={() => navigate("/deals/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                  <p className="text-sm text-muted-foreground">Closed Won</p>
                  <p className="text-2xl font-bold">${wonValue.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Deals</p>
                  <p className="text-2xl font-bold">{filteredDeals.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading deals...</p>
            ) : filteredDeals.length === 0 ? (
              <p className="text-center text-muted-foreground">No deals found</p>
            ) : (
              <div className="space-y-4">
                {filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{deal.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {deal.companies && (
                            <span>Company: {deal.companies.name}</span>
                          )}
                          {deal.contacts && (
                            <span>
                              Contact: {deal.contacts.first_name} {deal.contacts.last_name}
                            </span>
                          )}
                          {deal.close_date && (
                            <span>Close: {new Date(deal.close_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-lg font-bold">${deal.value?.toLocaleString()}</p>
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage.replace("_", " ")}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{deal.probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Deals;
