import { useEffect, useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "@/hooks/use-toast";
import { Target } from "lucide-react";

interface AgentTarget {
  id: string;
  user_id: string;
  period: string;
  period_start: string;
  calls_target: number;
  deals_target: number;
  revenue_target: number;
}

const Targets = () => {
  const { isManager } = useUserRole();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [targets, setTargets] = useState<AgentTarget[]>([]);
  const [actuals, setActuals] = useState<Record<string, { calls: number; deals: number; revenue: number }>>({});
  const [form, setForm] = useState({
    user_id: "", period: "monthly",
    period_start: new Date().toISOString().slice(0, 10),
    calls_target: 50, deals_target: 5, revenue_target: 10000,
  });

  const load = async () => {
    const [{ data: ps }, { data: ts }, { data: calls }, { data: deals }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("agent_targets").select("*").order("period_start", { ascending: false }),
      supabase.from("calls").select("user_id"),
      supabase.from("deals").select("user_id, value, status"),
    ]);
    setProfiles(ps || []);
    setTargets((ts as any) || []);
    const a: Record<string, { calls: number; deals: number; revenue: number }> = {};
    (calls || []).forEach((c: any) => { a[c.user_id] = a[c.user_id] || { calls: 0, deals: 0, revenue: 0 }; a[c.user_id].calls++; });
    (deals || []).forEach((d: any) => {
      a[d.user_id] = a[d.user_id] || { calls: 0, deals: 0, revenue: 0 };
      if (d.status === "won") { a[d.user_id].deals++; a[d.user_id].revenue += Number(d.value || 0); }
    });
    setActuals(a);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.user_id) { toast({ title: "Pick an agent", variant: "destructive" }); return; }
    const { error } = await supabase.from("agent_targets").upsert(form, { onConflict: "user_id,period,period_start" });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Target saved" });
    load();
  };

  const pct = (val: number, target: number) => target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0;
  const nameFor = (id: string) => profiles.find(p => p.id === id)?.full_name || profiles.find(p => p.id === id)?.email || id.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="w-7 h-7 text-primary" /> Targets & Quotas</h1>
          <p className="text-muted-foreground">Set sales quotas per agent and track progress.</p>
        </div>

        {isManager && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Set Target</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div>
                <Label>Agent</Label>
                <Select value={form.user_id} onValueChange={(v) => setForm(f => ({ ...f, user_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Period</Label>
                <Select value={form.period} onValueChange={(v) => setForm(f => ({ ...f, period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Start</Label><Input type="date" value={form.period_start} onChange={(e) => setForm(f => ({ ...f, period_start: e.target.value }))} /></div>
              <div><Label>Calls</Label><Input type="number" value={form.calls_target} onChange={(e) => setForm(f => ({ ...f, calls_target: Number(e.target.value) }))} /></div>
              <div><Label>Deals</Label><Input type="number" value={form.deals_target} onChange={(e) => setForm(f => ({ ...f, deals_target: Number(e.target.value) }))} /></div>
              <div className="flex gap-2">
                <div className="flex-1"><Label>Revenue</Label><Input type="number" value={form.revenue_target} onChange={(e) => setForm(f => ({ ...f, revenue_target: Number(e.target.value) }))} /></div>
                <Button onClick={save} className="self-end">Save</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Current Targets</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((t) => {
                  const a = actuals[t.user_id] || { calls: 0, deals: 0, revenue: 0 };
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{nameFor(t.user_id)}</TableCell>
                      <TableCell>{t.period} • {t.period_start}</TableCell>
                      <TableCell className="w-48"><Progress value={pct(a.calls, t.calls_target)} /><div className="text-xs mt-1">{a.calls}/{t.calls_target}</div></TableCell>
                      <TableCell className="w-48"><Progress value={pct(a.deals, t.deals_target)} /><div className="text-xs mt-1">{a.deals}/{t.deals_target}</div></TableCell>
                      <TableCell className="w-48"><Progress value={pct(a.revenue, Number(t.revenue_target))} /><div className="text-xs mt-1">${a.revenue.toLocaleString()}/${Number(t.revenue_target).toLocaleString()}</div></TableCell>
                    </TableRow>
                  );
                })}
                {targets.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No targets set.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Targets;
