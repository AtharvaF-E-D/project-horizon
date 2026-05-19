import { useEffect, useMemo, useState } from "react";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Video, MapPin,
  RefreshCw, Link2, Download, Repeat,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import {
  addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import {
  expandRecurrence, downloadICS, googleCalendarUrl, outlookCalendarUrl,
  type Recurrence,
} from "@/lib/calendar";
import { useSearchParams } from "react-router-dom";

type Appt = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_url: string | null;
  status: string;
  attendee_name: string | null;
  attendee_email: string | null;
  sync_provider: string;
  lead_id: string | null;
  recurrence_rule: string;
  recurrence_until: string | null;
  recurrence_parent_id: string | null;
};

type Lead = { id: string; first_name: string; last_name: string };

const blankForm = (start: Date) => ({
  title: "",
  description: "",
  start_time: format(start, "yyyy-MM-dd'T'HH:mm"),
  end_time: format(new Date(start.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
  location: "",
  meeting_url: "",
  attendee_name: "",
  attendee_email: "",
  sync_provider: "none",
  lead_id: "none",
  recurrence_rule: "none" as Recurrence,
  recurrence_until: "",
});

const Appointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [params] = useSearchParams();
  const [cursor, setCursor] = useState(new Date());
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appt | null>(null);
  const [form, setForm] = useState(blankForm(new Date()));

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    const [aRes, lRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time"),
      supabase.from("leads").select("id, first_name, last_name").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
    ]);
    if (aRes.error) toast({ title: "Failed to load", description: aRes.error.message, variant: "destructive" });
    setAppointments((aRes.data as Appt[]) || []);
    setLeads((lRes.data as Lead[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cursor]);

  // Auto-open new dialog for ?new=1 and preselect lead via ?lead=
  useEffect(() => {
    if (params.get("new") === "1") {
      const lead = params.get("lead");
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      setEditing(null);
      setForm({ ...blankForm(d), lead_id: lead || "none" });
      setDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    const out: Date[] = [];
    let d = start;
    while (d <= end) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [cursor]);

  const apptsByDay = useMemo(() => {
    const m = new Map<string, Appt[]>();
    appointments.forEach((a) => {
      const k = format(new Date(a.start_time), "yyyy-MM-dd");
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    });
    return m;
  }, [appointments]);

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => new Date(a.start_time) >= new Date())
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 5),
    [appointments]
  );

  const openNew = (date?: Date) => {
    const d = date ?? new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    setEditing(null);
    setForm(blankForm(d));
    setDialogOpen(true);
  };

  const openEdit = (a: Appt) => {
    setEditing(a);
    setForm({
      title: a.title,
      description: a.description ?? "",
      start_time: format(new Date(a.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(a.end_time), "yyyy-MM-dd'T'HH:mm"),
      location: a.location ?? "",
      meeting_url: a.meeting_url ?? "",
      attendee_name: a.attendee_name ?? "",
      attendee_email: a.attendee_email ?? "",
      sync_provider: a.sync_provider ?? "none",
      lead_id: a.lead_id ?? "none",
      recurrence_rule: (a.recurrence_rule as Recurrence) ?? "none",
      recurrence_until: a.recurrence_until ? format(new Date(a.recurrence_until), "yyyy-MM-dd") : "",
    });
    setDialogOpen(true);
  };

  const logAppointmentActivity = async (a: { id: string; title: string; start_time: string; lead_id: string | null }, op: "created" | "updated") => {
    await logActivity({
      activityType: "meeting_scheduled",
      title: `Appointment ${op}: ${a.title}`,
      description: `${format(new Date(a.start_time), "EEE, MMM d 'at' h:mm a")}`,
      entityType: a.lead_id ? "lead" : "appointment",
      entityId: a.lead_id || a.id,
      entityName: a.title,
      metadata: { appointment_id: a.id, operation: op },
    });
  };

  const save = async () => {
    if (!user || !form.title || !form.start_time || !form.end_time) {
      toast({ title: "Title, start and end are required", variant: "destructive" });
      return;
    }
    const startD = new Date(form.start_time);
    const endD = new Date(form.end_time);
    const leadId = form.lead_id === "none" ? null : form.lead_id;
    const basePayload = {
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      meeting_url: form.meeting_url || null,
      attendee_name: form.attendee_name || null,
      attendee_email: form.attendee_email || null,
      sync_provider: form.sync_provider,
      lead_id: leadId,
      recurrence_rule: form.recurrence_rule,
      recurrence_until: form.recurrence_until ? new Date(form.recurrence_until).toISOString() : null,
    };

    if (editing) {
      const { data, error } = await supabase
        .from("appointments")
        .update({
          ...basePayload,
          start_time: startD.toISOString(),
          end_time: endD.toISOString(),
        })
        .eq("id", editing.id)
        .select()
        .single();
      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
        return;
      }
      if (data) await logAppointmentActivity(data as any, "updated");
      toast({ title: "Appointment updated" });
    } else {
      // Materialize recurrence
      const occurrences = expandRecurrence(
        startD,
        endD,
        form.recurrence_rule,
        form.recurrence_until ? new Date(form.recurrence_until) : null
      );
      const first = occurrences[0];
      const { data: firstRow, error } = await supabase
        .from("appointments")
        .insert({
          ...basePayload,
          start_time: first.start.toISOString(),
          end_time: first.end.toISOString(),
        })
        .select()
        .single();
      if (error || !firstRow) {
        toast({ title: "Save failed", description: error?.message, variant: "destructive" });
        return;
      }
      if (occurrences.length > 1) {
        const rest = occurrences.slice(1).map((o) => ({
          ...basePayload,
          start_time: o.start.toISOString(),
          end_time: o.end.toISOString(),
          recurrence_parent_id: firstRow.id,
        }));
        await supabase.from("appointments").insert(rest);
      }
      await logAppointmentActivity(firstRow as any, "created");
      toast({
        title: "Appointment created",
        description: occurrences.length > 1 ? `${occurrences.length} occurrences scheduled` : undefined,
      });
    }
    setDialogOpen(false);
    load();
  };

  const remove = async () => {
    if (!editing) return;
    // Also delete child occurrences if this is a series parent
    await supabase.from("appointments").delete().eq("recurrence_parent_id", editing.id);
    const { error } = await supabase.from("appointments").delete().eq("id", editing.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Appointment deleted" });
    setDialogOpen(false);
    load();
  };

  const apptToICS = (a: Appt) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    location: a.location,
    meeting_url: a.meeting_url,
    start: new Date(a.start_time),
    end: new Date(a.end_time),
    attendee_email: a.attendee_email,
    recurrence_rule: a.recurrence_rule as Recurrence,
    recurrence_until: a.recurrence_until ? new Date(a.recurrence_until) : null,
  });

  const connectProvider = (provider: "google" | "outlook") => {
    toast({
      title: `${provider === "google" ? "Google Calendar" : "Outlook"} two-way sync`,
      description:
        "Two-way sync is coming soon. For now, use 'Add to Google/Outlook' on any appointment or download the .ics file.",
    });
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-7 h-7 text-primary" /> Appointments
              </h1>
              <p className="text-muted-foreground">Schedule meetings and sync with your calendar</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => connectProvider("google")}>
                <Link2 className="w-4 h-4 mr-1" /> Connect Google
              </Button>
              <Button variant="outline" size="sm" onClick={() => connectProvider("outlook")}>
                <Link2 className="w-4 h-4 mr-1" /> Connect Outlook
              </Button>
              <Button onClick={() => openNew()} className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> New
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{format(cursor, "MMMM yyyy")}</h2>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
                  <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d) => {
                  const key = format(d, "yyyy-MM-dd");
                  const dayAppts = apptsByDay.get(key) || [];
                  const inMonth = isSameMonth(d, cursor);
                  const isToday = isSameDay(d, today);
                  return (
                    <button
                      key={key}
                      onClick={() => openNew(d)}
                      className={`min-h-[88px] text-left p-1.5 rounded-md border transition-colors ${
                        inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground"
                      } ${isToday ? "border-primary ring-1 ring-primary/30" : "border-border"} hover:bg-muted/50`}
                    >
                      <div className="text-xs font-semibold mb-1">{format(d, "d")}</div>
                      <div className="space-y-0.5">
                        {dayAppts.slice(0, 2).map((a) => (
                          <div
                            key={a.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(a);
                            }}
                            className="text-[10px] leading-tight px-1 py-0.5 rounded bg-primary/15 text-primary truncate cursor-pointer hover:bg-primary/25 flex items-center gap-1"
                          >
                            {(a.recurrence_rule !== "none" || a.recurrence_parent_id) && (
                              <Repeat className="w-2.5 h-2.5 flex-shrink-0" />
                            )}
                            <span className="truncate">{format(new Date(a.start_time), "HH:mm")} {a.title}</span>
                          </div>
                        ))}
                        {dayAppts.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">+{dayAppts.length - 2} more</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No upcoming appointments</p>
                ) : (
                  upcoming.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => openEdit(a)}
                      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm flex items-center gap-1">
                          {(a.recurrence_rule !== "none" || a.recurrence_parent_id) && (
                            <Repeat className="w-3 h-3 text-primary" />
                          )}
                          {a.title}
                        </div>
                        {a.sync_provider !== "none" && (
                          <Badge variant="outline" className="text-[10px]">{a.sync_provider}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(a.start_time), "EEE, MMM d · h:mm a")}
                      </div>
                      {a.meeting_url && (
                        <div className="text-xs text-primary flex items-center gap-1 mt-1">
                          <Video className="w-3 h-3" /> Online
                        </div>
                      )}
                      {a.location && !a.meeting_url && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {a.location}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit appointment" : "New appointment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start *</Label>
                <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End *</Label>
                <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Repeats</Label>
                <Select
                  value={form.recurrence_rule}
                  onValueChange={(v) => setForm({ ...form, recurrence_rule: v as Recurrence })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Repeat until</Label>
                <Input
                  type="date"
                  value={form.recurrence_until}
                  onChange={(e) => setForm({ ...form, recurrence_until: e.target.value })}
                  disabled={form.recurrence_rule === "none"}
                />
              </div>
            </div>

            <div>
              <Label>Related lead</Label>
              <Select value={form.lead_id} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                <SelectTrigger><SelectValue placeholder="No lead linked" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No lead linked</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.first_name} {l.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Attendee name</Label>
                <Input value={form.attendee_name} onChange={(e) => setForm({ ...form, attendee_name: e.target.value })} />
              </div>
              <div>
                <Label>Attendee email</Label>
                <Input type="email" value={form.attendee_email} onChange={(e) => setForm({ ...form, attendee_email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label>Meeting URL</Label>
                <Input value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {editing && (
              <div className="pt-2 border-t">
                <Label className="text-xs uppercase text-muted-foreground">Add to calendar</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => downloadICS(apptToICS(editing))}>
                    <Download className="w-3 h-3 mr-1" /> .ics
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={googleCalendarUrl(apptToICS(editing))} target="_blank" rel="noreferrer">Google</a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={outlookCalendarUrl(apptToICS(editing))} target="_blank" rel="noreferrer">Outlook</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <Button variant="destructive" onClick={remove} className="mr-auto">Delete</Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} className="gradient-primary text-primary-foreground">
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
