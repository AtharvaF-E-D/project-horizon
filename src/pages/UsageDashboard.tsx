import { useEffect, useMemo, useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Workflow, Zap, Brain, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";

type RangeKey = "7" | "30" | "90";

interface DailyPoint { date: string; runs: number; success: number; failed: number; workflows: number; training: number; }
interface StatusSlice { name: string; value: number; }

const COLORS = ["#00C4B4", "#FFD54F", "#7E57C2", "#EF4444", "#3B82F6"];

const formatDay = (d: Date) => d.toISOString().slice(0, 10);

const UsageDashboard = () => {
  const [range, setRange] = useState<RangeKey>("30");
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<DailyPoint[]>([]);
  const [statusSlices, setStatusSlices] = useState<StatusSlice[]>([]);
  const [trainingByType, setTrainingByType] = useState<StatusSlice[]>([]);
  const [totals, setTotals] = useState({ runs: 0, workflows: 0, training: 0, successRate: 0 });

  const load = async () => {
    setLoading(true);
    const days = parseInt(range, 10);
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const [{ data: runs }, { data: workflows }, { data: training }] = await Promise.all([
      supabase.from("workflow_runs").select("status, started_at").gte("started_at", sinceIso),
      supabase.from("automation_workflows").select("is_active, created_at, updated_at").gte("updated_at", sinceIso),
      supabase.from("ai_training").select("training_type, created_at").gte("created_at", sinceIso),
    ]);

    const buckets = new Map<string, DailyPoint>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const k = formatDay(d);
      buckets.set(k, { date: k, runs: 0, success: 0, failed: 0, workflows: 0, training: 0 });
    }

    const statusMap = new Map<string, number>();
    (runs || []).forEach((r: any) => {
      const k = formatDay(new Date(r.started_at));
      const b = buckets.get(k);
      if (b) {
        b.runs += 1;
        if (r.status === "completed" || r.status === "success") b.success += 1;
        else if (r.status === "failed" || r.status === "error") b.failed += 1;
      }
      statusMap.set(r.status || "unknown", (statusMap.get(r.status || "unknown") || 0) + 1);
    });

    (workflows || []).forEach((w: any) => {
      const k = formatDay(new Date(w.updated_at || w.created_at));
      const b = buckets.get(k);
      if (b) b.workflows += 1;
    });

    const trainMap = new Map<string, number>();
    (training || []).forEach((t: any) => {
      const k = formatDay(new Date(t.created_at));
      const b = buckets.get(k);
      if (b) b.training += 1;
      const type = t.training_type || "general";
      trainMap.set(type, (trainMap.get(type) || 0) + 1);
    });

    const data = Array.from(buckets.values());
    setSeries(data);
    setStatusSlices(Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })));
    setTrainingByType(Array.from(trainMap.entries()).map(([name, value]) => ({ name, value })));

    const totalRuns = runs?.length || 0;
    const totalSuccess = (runs || []).filter((r: any) => r.status === "completed" || r.status === "success").length;
    setTotals({
      runs: totalRuns,
      workflows: workflows?.length || 0,
      training: training?.length || 0,
      successRate: totalRuns ? Math.round((totalSuccess / totalRuns) * 100) : 0,
    });
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range]);

  const kpis = useMemo(() => ([
    { label: "Workflow Runs", value: totals.runs, icon: Zap, color: "text-primary" },
    { label: "Active/Updated Workflows", value: totals.workflows, icon: Workflow, color: "text-secondary-foreground" },
    { label: "AI Training Items", value: totals.training, icon: Brain, color: "text-accent-foreground" },
    { label: "Run Success Rate", value: `${totals.successRate}%`, icon: BarChart3, color: "text-primary" },
  ]), [totals]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" /> Usage Dashboard
            </h1>
            <p className="text-muted-foreground">Workflow runs, automations activity, and AI training volume.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : k.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{k.label}</div>
                    </div>
                    <Icon className={`w-8 h-8 opacity-60 ${k.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Workflow Runs Over Time</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[280px] w-full" /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C4B4" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#00C4B4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="success" stroke="#00C4B4" fill="url(#gSuccess)" name="Succeeded" />
                    <Area type="monotone" dataKey="failed" stroke="#EF4444" fill="url(#gFailed)" name="Failed" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Automations Activity (Workflows Updated)</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="workflows" fill="#7E57C2" name="Workflows" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">AI Training Volume</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="training" stroke="#FFD54F" strokeWidth={2} dot={{ r: 3 }} name="Training items" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Run Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : statusSlices.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No runs in this range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusSlices} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {statusSlices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">AI Training by Type</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : trainingByType.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No training data in this range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trainingByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" fontSize={11} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00C4B4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UsageDashboard;
