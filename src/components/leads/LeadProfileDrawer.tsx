import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, Building, ExternalLink, Sparkles, Loader2, Clock } from "lucide-react";
import { LeadFiles } from "./LeadFiles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insights`;

export const LeadProfileDrawer = ({ leadId, open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!leadId || !open) return;
    setLoading(true);
    (async () => {
      const [leadRes, actsRes] = await Promise.all([
        supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
        supabase
          .from("activities")
          .select("*")
          .eq("entity_type", "lead")
          .eq("entity_id", leadId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setLead(leadRes.data);
      setActivities(actsRes.data || []);
      setLoading(false);
    })();
  }, [leadId, open]);

  const runAI = async () => {
    if (!lead) return;
    setAiLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "summarize_lead",
          payload: { lead },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI failed");
      const patch = {
        ai_summary: json.summary ?? json.ai_summary ?? null,
        ai_next_action: json.next_action ?? json.ai_next_action ?? null,
        ai_score_label: json.score_label ?? json.ai_score_label ?? lead.ai_score_label,
        ai_updated_at: new Date().toISOString(),
      };
      await supabase.from("leads").update(patch).eq("id", lead.id);
      setLead({ ...lead, ...patch });
      toast({ title: "AI insights updated" });
    } catch (e: any) {
      toast({ title: "AI error", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {loading || !lead ? (
          <div className="space-y-4 pt-8">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {lead.first_name?.[0]}
                  {lead.last_name?.[0]}
                </div>
                <div className="flex-1">
                  <div className="text-xl">
                    {lead.first_name} {lead.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground font-normal">{lead.title || "—"}</div>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline">{lead.status}</Badge>
              <Badge variant="outline">{lead.source}</Badge>
              {lead.ai_score_label && (
                <Badge className="bg-primary/15 text-primary border-primary/30">{lead.ai_score_label}</Badge>
              )}
              <Badge variant="secondary">Score {lead.score ?? 0}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
              {lead.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" /> {lead.email}
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" /> {lead.phone}
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="w-4 h-4" /> {lead.company}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1" onClick={() => navigate(`/leads/${lead.id}`)}>
                <ExternalLink className="w-4 h-4 mr-1" /> Open full view
              </Button>
              <Button size="sm" variant="outline" onClick={runAI} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            </div>

            <Tabs defaultValue="ai" className="mt-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="ai">AI Insights</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="space-y-3 mt-4">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Summary</div>
                  <p className="text-sm">{lead.ai_summary || "No summary yet. Run AI to generate."}</p>
                </div>
                <div className="p-3 rounded-lg border bg-primary/5">
                  <div className="text-xs uppercase tracking-wide text-primary mb-1">Suggested next action</div>
                  <p className="text-sm">{lead.ai_next_action || "—"}</p>
                </div>
                {lead.notes && (
                  <div className="p-3 rounded-lg border">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Notes</div>
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-3 mt-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
                ) : (
                  activities.map((a) => (
                    <div key={a.id} className="flex gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{a.title}</div>
                        {a.description && <div className="text-muted-foreground text-xs">{a.description}</div>}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(a.created_at), "MMM d, yyyy · h:mm a")}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <LeadFiles leadId={lead.id} userId={lead.user_id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
