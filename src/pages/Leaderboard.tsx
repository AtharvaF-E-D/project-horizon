import { useEffect, useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Circle } from "lucide-react";

interface Row {
  user_id: string;
  name: string;
  email: string;
  calls: number;
  deals_won: number;
  revenue: number;
  status: string;
}

const Leaderboard = () => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: profiles }, { data: calls }, { data: deals }, { data: presence }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("calls").select("user_id"),
        supabase.from("deals").select("user_id, value, status"),
        supabase.from("agent_presence").select("user_id, status, last_seen"),
      ]);

      const map = new Map<string, Row>();
      (profiles || []).forEach((p: any) => map.set(p.id, {
        user_id: p.id, name: p.full_name || p.email, email: p.email,
        calls: 0, deals_won: 0, revenue: 0, status: "offline",
      }));
      (calls || []).forEach((c: any) => {
        const r = map.get(c.user_id); if (r) r.calls += 1;
      });
      (deals || []).forEach((d: any) => {
        const r = map.get(d.user_id);
        if (r && d.status === "won") { r.deals_won += 1; r.revenue += Number(d.value || 0); }
      });
      (presence || []).forEach((p: any) => {
        const r = map.get(p.user_id);
        if (r) {
          const fresh = new Date(p.last_seen).getTime() > Date.now() - 90_000;
          r.status = fresh ? p.status : "offline";
        }
      });

      setRows(Array.from(map.values()).sort((a, b) => b.revenue - a.revenue || b.deals_won - a.deals_won));
    };
    load();

    const channel = supabase.channel("presence-leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_presence" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Trophy className="w-7 h-7 text-yellow-500" /> Leaderboard</h1>
          <p className="text-muted-foreground">Live agent activity and performance.</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Team Performance</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Deals Won</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="font-semibold">{i + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "online" ? "default" : "outline"} className="gap-1">
                        <Circle className={`w-2 h-2 ${r.status === "online" ? "fill-green-500 text-green-500" : "fill-muted-foreground text-muted-foreground"}`} />
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{r.calls}</TableCell>
                    <TableCell className="text-right">{r.deals_won}</TableCell>
                    <TableCell className="text-right">${r.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No data yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
