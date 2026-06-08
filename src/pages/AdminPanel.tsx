import { useEffect, useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Plus } from "lucide-react";

interface Plan { id: string; name: string; description: string | null; price_monthly: number; price_yearly: number; max_users: number | null; max_ai_calls: number | null; is_active: boolean; features: any; }
interface UsageRow { user_id: string; metric_type: string; total: number; email?: string; }

const AdminPanel = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [counts, setCounts] = useState({ users: 0, workflows: 0, calls: 0, leads: 0 });
  const [newPlan, setNewPlan] = useState({ name: "", description: "", price_monthly: 0, price_yearly: 0, max_users: 0, max_ai_calls: 0 });

  const load = async () => {
    const [{ data: ps }, { data: um }, { data: profiles }, { count: usersCount }, { count: wfCount }, { count: callsCount }, { count: leadsCount }] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("price_monthly"),
      supabase.from("usage_metrics").select("user_id, metric_type, count"),
      supabase.from("profiles").select("id, email"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("automation_workflows").select("*", { count: "exact", head: true }),
      supabase.from("calls").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*", { count: "exact", head: true }),
    ]);
    setPlans((ps as any) || []);
    const emailMap = new Map((profiles || []).map((p: any) => [p.id, p.email]));
    const grouped = new Map<string, UsageRow>();
    (um || []).forEach((r: any) => {
      const k = `${r.user_id}-${r.metric_type}`;
      const cur = grouped.get(k) || { user_id: r.user_id, metric_type: r.metric_type, total: 0, email: emailMap.get(r.user_id) };
      cur.total += r.count;
      grouped.set(k, cur);
    });
    setUsage(Array.from(grouped.values()).sort((a, b) => b.total - a.total).slice(0, 50));
    setCounts({ users: usersCount || 0, workflows: wfCount || 0, calls: callsCount || 0, leads: leadsCount || 0 });
  };

  useEffect(() => { load(); }, []);

  const savePlan = async () => {
    if (!newPlan.name) return;
    const { error } = await supabase.from("subscription_plans").insert({
      ...newPlan,
      max_users: newPlan.max_users || null,
      max_ai_calls: newPlan.max_ai_calls || null,
      features: [],
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Plan added" });
    setNewPlan({ name: "", description: "", price_monthly: 0, price_yearly: 0, max_users: 0, max_ai_calls: 0 });
    load();
  };

  const togglePlan = async (p: Plan) => {
    await supabase.from("subscription_plans").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-primary" /> Admin Panel</h1>
          <p className="text-muted-foreground">Subscription plans, usage tracking, system overview.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Users", value: counts.users },
            { label: "Workflows", value: counts.workflows },
            { label: "Calls", value: counts.calls },
            { label: "Leads", value: counts.leads },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{c.value}</div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="plans">
          <TabsList>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
          </TabsList>
          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Plan</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div><Label>Name</Label><Input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} /></div>
                <div><Label>Monthly</Label><Input type="number" value={newPlan.price_monthly} onChange={(e) => setNewPlan({ ...newPlan, price_monthly: Number(e.target.value) })} /></div>
                <div><Label>Yearly</Label><Input type="number" value={newPlan.price_yearly} onChange={(e) => setNewPlan({ ...newPlan, price_yearly: Number(e.target.value) })} /></div>
                <div><Label>Max Users</Label><Input type="number" value={newPlan.max_users} onChange={(e) => setNewPlan({ ...newPlan, max_users: Number(e.target.value) })} /></div>
                <div><Label>Max AI</Label><Input type="number" value={newPlan.max_ai_calls} onChange={(e) => setNewPlan({ ...newPlan, max_ai_calls: Number(e.target.value) })} /></div>
                <Button onClick={savePlan}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Plan</TableHead><TableHead>Monthly</TableHead><TableHead>Yearly</TableHead>
                    <TableHead>Users</TableHead><TableHead>AI/mo</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {plans.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>${p.price_monthly}</TableCell>
                        <TableCell>${p.price_yearly}</TableCell>
                        <TableCell>{p.max_users ?? "∞"}</TableCell>
                        <TableCell>{p.max_ai_calls ?? "∞"}</TableCell>
                        <TableCell><Badge variant={p.is_active ? "default" : "outline"}>{p.is_active ? "active" : "inactive"}</Badge></TableCell>
                        <TableCell><Button size="sm" variant="ghost" onClick={() => togglePlan(p)}>{p.is_active ? "Disable" : "Enable"}</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="usage">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead><TableHead>Metric</TableHead><TableHead className="text-right">Total</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {usage.map((u, i) => (
                      <TableRow key={i}>
                        <TableCell>{u.email || u.user_id.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant="outline">{u.metric_type}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{u.total}</TableCell>
                      </TableRow>
                    ))}
                    {usage.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No usage tracked yet.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
