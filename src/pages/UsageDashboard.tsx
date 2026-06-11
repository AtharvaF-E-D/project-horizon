import { useEffect, useMemo, useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Workflow, Zap, Brain, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";

type RangeKey = "7" | "30" | "90";

interface DailyPoint { date: string; runs: number; success: number; failed: number; workflows: number; training: number; }
interface StatusSlice { name: string; value: number; }

const COLORS = ["#00C4B4", "#FFD54F", "#7E57C2", "#EF4444", "#3B82F6"];

const formatDay = (d: Date) => d.toISOString().slice(0, 10);

type DrillKind = "runs" | "training" | null;
interface DrillState {
  kind: DrillKind;
  date?: string;
  trainingType?: string;
  status?: string;
}

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) return "";
  const headers = Array.from(rows.reduce((acc, r) => { Object.keys(r).forEach(k => acc.add(k)); return acc; }, new Set<string>()));
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
};

const downloadCsv = (filename: string, rows: Record<string, unknown>[]) => {
  if (rows.length === 0) { toast.error("No data to export"); return; }
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${filename}`);
};

const UsageDashboard = () => {
  const [range, setRange] = useState<RangeKey>("30");
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<DailyPoint[]>([]);
  const [statusSlices, setStatusSlices] = useState<StatusSlice[]>([]);
  const [trainingByType, setTrainingByType] = useState<StatusSlice[]>([]);
  const [totals, setTotals] = useState({ runs: 0, workflows: 0, training: 0, successRate: 0 });

  const [drill, setDrill] = useState<DrillState>({ kind: null });
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillRows, setDrillRows] = useState<any[]>([]);

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

  const dayBounds = (date: string) => {
    const start = new Date(date + "T00:00:00.000Z");
    const end = new Date(start); end.setUTCDate(start.getUTCDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const openDrill = async (state: DrillState) => {
    setDrill(state);
    setDrillLoading(true);
    setDrillRows([]);
    try {
      if (state.kind === "runs") {
        let q = supabase.from("workflow_runs")
          .select("id, status, started_at, completed_at, workflow_id, error_message, automation_workflows(name)")
          .order("started_at", { ascending: false })
          .limit(200);
        if (state.date) {
          const { start, end } = dayBounds(state.date);
          q = q.gte("started_at", start).lt("started_at", end);
        }
        if (state.status) q = q.eq("status", state.status);
        const { data, error } = await q;
        if (error) throw error;
        setDrillRows(data || []);
      } else if (state.kind === "training") {
        let q = supabase.from("ai_training")
          .select("id, training_type, content, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(200);
        if (state.date) {
          const { start, end } = dayBounds(state.date);
          q = q.gte("created_at", start).lt("created_at", end);
        }
        if (state.trainingType) q = q.eq("training_type", state.trainingType);
        const { data, error } = await q;
        if (error) throw error;
        setDrillRows(data || []);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load details");
    } finally {
      setDrillLoading(false);
    }
  };

  const exportAll = () => {
    downloadCsv(`usage-daily-${range}d.csv`, series as any);
  };
  const exportStatus = () => downloadCsv(`run-status-${range}d.csv`, statusSlices as any);
  const exportTrainingType = () => downloadCsv(`training-by-type-${range}d.csv`, trainingByType as any);
  const exportDrill = () => {
    const flat = drillRows.map(r => {
      const { automation_workflows, ...rest } = r;
      return { ...rest, workflow_name: automation_workflows?.name ?? "" };
    });
    downloadCsv(`drilldown-${drill.kind}-${drill.date || drill.status || drill.trainingType || "all"}.csv`, flat);
  };

  const kpis = useMemo(() => ([
    { label: "Workflow Runs", value: totals.runs, icon: Zap, color: "text-primary" },
    { label: "Active/Updated Workflows", value: totals.workflows, icon: Workflow, color: "text-secondary-foreground" },
    { label: "AI Training Items", value: totals.training, icon: Brain, color: "text-accent-foreground" },
    { label: "Run Success Rate", value: `${totals.successRate}%`, icon: BarChart3, color: "text-primary" },
  ]), [totals]);

  const chartClickRuns = (e: any) => {
    const date = e?.activeLabel || e?.activePayload?.[0]?.payload?.date;
    if (date) openDrill({ kind: "runs", date });
  };
  const chartClickTraining = (e: any) => {
    const date = e?.activeLabel || e?.activePayload?.[0]?.payload?.date;
    if (date) openDrill({ kind: "training", date });
  };

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
            <p className="text-muted-foreground">Click any chart point to drill into the underlying records.</p>
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
            <Button variant="outline" onClick={exportAll} disabled={loading}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Workflow Runs Over Time</CardTitle>
              <Button variant="ghost" size="sm" onClick={exportAll}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[280px] w-full" /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={series} onClick={chartClickRuns} style={{ cursor: "pointer" }}>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Automations Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={exportAll}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={series} onClick={chartClickRuns} style={{ cursor: "pointer" }}>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">AI Training Volume</CardTitle>
              <Button variant="ghost" size="sm" onClick={exportAll}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={series} onClick={chartClickTraining} style={{ cursor: "pointer" }}>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Run Status Breakdown</CardTitle>
              <Button variant="ghost" size="sm" onClick={exportStatus}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : statusSlices.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No runs in this range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusSlices} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}
                      onClick={(d: any) => openDrill({ kind: "runs", status: d?.name })} style={{ cursor: "pointer" }}>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">AI Training by Type</CardTitle>
              <Button variant="ghost" size="sm" onClick={exportTrainingType}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[260px] w-full" /> : trainingByType.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No training data in this range.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trainingByType} layout="vertical"
                    onClick={(e: any) => {
                      const name = e?.activeLabel || e?.activePayload?.[0]?.payload?.name;
                      if (name) openDrill({ kind: "training", trainingType: name });
                    }}
                    style={{ cursor: "pointer" }}>
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

        <Sheet open={drill.kind !== null} onOpenChange={(o) => !o && setDrill({ kind: null })}>
          <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
            <SheetHeader>
              <SheetTitle>
                {drill.kind === "runs" ? "Workflow Run Details" : "AI Training Records"}
              </SheetTitle>
              <SheetDescription>
                {drill.date && <span>Date: <strong>{drill.date}</strong> · </span>}
                {drill.status && <span>Status: <strong>{drill.status}</strong> · </span>}
                {drill.trainingType && <span>Type: <strong>{drill.trainingType}</strong> · </span>}
                <span>{drillRows.length} record{drillRows.length === 1 ? "" : "s"}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex items-center justify-end gap-2 my-3">
              <Button variant="outline" size="sm" onClick={exportDrill} disabled={drillRows.length === 0}>
                <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
              </Button>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              {drillLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : drillRows.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No records found.</div>
              ) : drill.kind === "runs" ? (
                <div className="space-y-2 pb-6">
                  {drillRows.map((r: any) => (
                    <div key={r.id} className="border rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium truncate">{r.automation_workflows?.name || "Workflow"}</div>
                        <Badge variant={r.status === "completed" || r.status === "success" ? "default" : r.status === "failed" || r.status === "error" ? "destructive" : "secondary"}>
                          {r.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(r.started_at).toLocaleString()}
                        {r.completed_at && <> · Completed: {new Date(r.completed_at).toLocaleString()}</>}
                      </div>
                      {r.error_message && (
                        <div className="text-xs text-destructive mt-1 break-words">{r.error_message}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 pb-6">
                  {drillRows.map((r: any) => (
                    <div key={r.id} className="border rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{r.training_type || "general"}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words line-clamp-6">
                        {typeof r.content === "string" ? r.content : JSON.stringify(r.content, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
};

export default UsageDashboard;
