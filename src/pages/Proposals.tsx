import { useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, FileText, Eye, Copy, Send, Clock, CheckCircle2, XCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Proposal {
  id: string;
  title: string;
  client: string;
  value: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected";
  createdAt: string;
  expiresAt: string;
  viewCount: number;
}

const mockProposals: Proposal[] = [
  { id: "1", title: "Enterprise CRM Implementation", client: "TechCorp Solutions", value: 45000, status: "viewed", createdAt: "2026-02-01", expiresAt: "2026-03-01", viewCount: 5 },
  { id: "2", title: "Marketing Automation Setup", client: "Digital Agency", value: 12000, status: "accepted", createdAt: "2026-01-20", expiresAt: "2026-02-20", viewCount: 3 },
  { id: "3", title: "Sales Pipeline Optimization", client: "StartupXYZ", value: 8500, status: "sent", createdAt: "2026-02-10", expiresAt: "2026-03-10", viewCount: 0 },
  { id: "4", title: "Data Migration & Integration", client: "Enterprise Co", value: 32000, status: "draft", createdAt: "2026-02-12", expiresAt: "2026-03-12", viewCount: 0 },
  { id: "5", title: "Custom Dashboard Development", client: "Global Retail", value: 18000, status: "rejected", createdAt: "2026-01-15", expiresAt: "2026-02-15", viewCount: 7 },
];

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  draft: { label: "Draft", class: "bg-muted text-muted-foreground", icon: Edit },
  sent: { label: "Sent", class: "bg-blue-500/10 text-blue-600", icon: Send },
  viewed: { label: "Viewed", class: "bg-yellow-500/10 text-yellow-600", icon: Eye },
  accepted: { label: "Accepted", class: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  rejected: { label: "Rejected", class: "bg-red-500/10 text-red-600", icon: XCircle },
};

export default function Proposals() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filtered = mockProposals.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = mockProposals.reduce((s, p) => s + p.value, 0);
  const wonValue = mockProposals.filter(p => p.status === "accepted").reduce((s, p) => s + p.value, 0);
  const winRate = mockProposals.length > 0 ? Math.round((mockProposals.filter(p => p.status === "accepted").length / mockProposals.filter(p => p.status !== "draft").length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Proposal Builder</h1>
              <p className="text-muted-foreground mt-2">Create, send, and track professional proposals</p>
            </div>
            <Button className="gradient-primary text-primary-foreground" onClick={() => toast({ title: "Coming soon", description: "Proposal builder will be available shortly." })}>
              <Plus className="w-4 h-4 mr-2" /> New Proposal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="card-hover"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Pipeline</p><p className="text-2xl font-bold">${totalValue.toLocaleString()}</p></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Won Value</p><p className="text-2xl font-bold text-green-500">${wonValue.toLocaleString()}</p></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Win Rate</p><p className="text-2xl font-bold">{winRate}%</p></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Active Proposals</p><p className="text-2xl font-bold">{mockProposals.filter(p => ["sent", "viewed"].includes(p.status)).length}</p></CardContent></Card>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search proposals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-4">
            {filtered.map(proposal => {
              const StatusIcon = statusConfig[proposal.status].icon;
              return (
                <Card key={proposal.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{proposal.title}</h3>
                            <Badge className={statusConfig[proposal.status].class}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[proposal.status].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{proposal.client}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span><Eye className="w-3 h-3 inline mr-1" />{proposal.viewCount} views</span>
                            <span><Clock className="w-3 h-3 inline mr-1" />Expires {new Date(proposal.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="text-xl font-bold">${proposal.value.toLocaleString()}</p>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon"><Copy className="w-4 h-4" /></Button>
                          {proposal.status === "draft" && <Button variant="ghost" size="icon"><Send className="w-4 h-4" /></Button>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}