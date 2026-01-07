import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2, Globe, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PermissionGate } from "@/components/common/PermissionGate";

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  size: string;
  phone: string;
}

const Companies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8 pt-20 ml-64">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Companies</h1>
              <p className="text-muted-foreground">Manage your company accounts</p>
            </div>
            <PermissionGate permission="canDeleteRecords">
              <Button onClick={() => navigate("/companies/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Company
              </Button>
            </PermissionGate>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading companies...</p>
            ) : filteredCompanies.length === 0 ? (
              <p className="text-center text-muted-foreground">No companies found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanies.map((company) => (
                  <Card
                    key={company.id}
                    onClick={() => navigate(`/companies/${company.id}`)}
                    className="p-6 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-2 truncate">
                          {company.name}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {company.industry && (
                            <p className="truncate">{company.industry}</p>
                          )}
                          {company.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span className="truncate">{company.website}</span>
                            </div>
                          )}
                          {company.size && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{company.size}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Companies;
