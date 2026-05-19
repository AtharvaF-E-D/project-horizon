import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Mail, Phone, Building, TrendingUp, Users, Target, Flame, Snowflake, Smile } from "lucide-react";
import { PermissionGate } from "@/components/common/PermissionGate";
import { useUserRole } from "@/hooks/useUserRole";
import { LeadsBulkActions } from "@/components/leads/LeadsBulkActions";
import { LeadProfileDrawer } from "@/components/leads/LeadProfileDrawer";

const Leads = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(params.get("status") || "all");
  const [sourceFilter, setSourceFilter] = useState<string>(params.get("source") || "all");
  const [aiFilter, setAiFilter] = useState<string>(params.get("ai") || "all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const { permissions } = useUserRole();

  // Sync if URL params change
  useEffect(() => {
    setStatusFilter(params.get("status") || "all");
    setSourceFilter(params.get("source") || "all");
    setAiFilter(params.get("ai") || "all");
  }, [params]);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", statusFilter, sourceFilter, aiFilter],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }
      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter as any);
      }
      if (aiFilter !== "all") {
        query = query.eq("ai_score_label", aiFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      lead.first_name.toLowerCase().includes(searchLower) ||
      lead.last_name.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.company?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === "new").length || 0,
    qualified: leads?.filter((l) => l.status === "qualified").length || 0,
    converted: leads?.filter((l) => l.status === "converted").length || 0,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/10 text-blue-500",
      contacted: "bg-purple-500/10 text-purple-500",
      qualified: "bg-green-500/10 text-green-500",
      unqualified: "bg-red-500/10 text-red-500",
      converted: "bg-emerald-500/10 text-emerald-500",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!filteredLeads) return;
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const allSelected = filteredLeads && filteredLeads.length > 0 && selectedIds.length === filteredLeads.length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />

      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Leads</h1>
              <p className="text-muted-foreground">Manage and track your sales leads</p>
            </div>
            <PermissionGate permission="leads">
              <Button onClick={() => navigate("/leads/new")} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Lead
              </Button>
            </PermissionGate>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Leads</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">New</p>
                    <p className="text-2xl font-bold">{stats.new}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Qualified</p>
                    <p className="text-2xl font-bold">{stats.qualified}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Converted</p>
                    <p className="text-2xl font-bold">{stats.converted}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search leads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email_campaign">Email Campaign</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={aiFilter} onValueChange={setAiFilter}>
                  <SelectTrigger className="w-full md:w-[160px]">
                    <SelectValue placeholder="AI Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="Hot">🔥 Hot</SelectItem>
                    <SelectItem value="Warm">😊 Warm</SelectItem>
                    <SelectItem value="Cold">❄️ Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Select All */}
          {filteredLeads && filteredLeads.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all ({filteredLeads.length})
              </span>
            </div>
          )}

          {/* Leads List */}
          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">Loading leads...</CardContent>
              </Card>
            ) : filteredLeads && filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedIds.includes(lead.id) ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.includes(lead.id)}
                          onCheckedChange={() => toggleSelect(lead.id)}
                        />
                      </div>
                      <div
                        className="flex items-start justify-between flex-1"
                        onClick={() => setDrawerLeadId(lead.id)}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold">
                              {lead.first_name} {lead.last_name}
                            </h3>
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                            <Badge variant="outline">{lead.source}</Badge>
                            {(lead as any).ai_score_label === "Hot" && (
                              <Badge variant="outline" className="bg-red-500/15 text-red-600 border-red-500/30">
                                <Flame className="w-3 h-3 mr-1" /> Hot
                              </Badge>
                            )}
                            {(lead as any).ai_score_label === "Warm" && (
                              <Badge variant="outline" className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">
                                <Smile className="w-3 h-3 mr-1" /> Warm
                              </Badge>
                            )}
                            {(lead as any).ai_score_label === "Cold" && (
                              <Badge variant="outline" className="bg-blue-500/15 text-blue-600 border-blue-500/30">
                                <Snowflake className="w-3 h-3 mr-1" /> Cold
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {lead.company && (
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                {lead.company}
                              </div>
                            )}
                            {lead.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {lead.email}
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {lead.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Score</div>
                          <div className="text-2xl font-bold text-primary">{lead.score}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No leads found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && leads && (
        <LeadsBulkActions
          selectedIds={selectedIds}
          leads={leads}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      <LeadProfileDrawer
        leadId={drawerLeadId}
        open={!!drawerLeadId}
        onOpenChange={(o) => !o && setDrawerLeadId(null)}
      />
    </div>
  );
};

export default Leads;
