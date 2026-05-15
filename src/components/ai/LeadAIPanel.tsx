import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Flame, Snowflake, Smile, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  leadId: string;
  leadData: Record<string, any>;
  initial: { ai_score_label?: string | null; ai_summary?: string | null; ai_next_action?: string | null };
  onUpdated?: (patch: Record<string, any>) => void;
}

const labelStyle: Record<string, { icon: any; cls: string }> = {
  Hot: { icon: Flame, cls: "bg-red-500/15 text-red-600 border-red-500/30" },
  Warm: { icon: Smile, cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  Cold: { icon: Snowflake, cls: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
};

export function LeadAIPanel({ leadId, leadData, initial, onUpdated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initial);

  const run = async () => {
    setLoading(true);
    try {
      const [score, sum, next] = await Promise.all([
        supabase.functions.invoke("ai-insights", { body: { action: "score_lead", payload: leadData } }),
        supabase.functions.invoke("ai-insights", { body: { action: "summarize_lead", payload: leadData } }),
        supabase.functions.invoke("ai-insights", { body: { action: "next_action_lead", payload: leadData } }),
      ]);
      const errors = [score.error, sum.error, next.error].filter(Boolean);
      if (errors.length) throw new Error(errors[0]?.message || "AI request failed");

      const patch = {
        ai_score_label: score.data?.result?.label ?? null,
        ai_summary: sum.data?.result?.summary ?? null,
        ai_next_action: next.data?.result?.next_action ?? null,
        ai_updated_at: new Date().toISOString(),
        score: score.data?.result?.score ?? leadData.score ?? 0,
      };
      const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
      if (error) throw error;
      setData(patch);
      onUpdated?.(patch);
      toast({ title: "AI insights updated" });
    } catch (e: any) {
      toast({ title: "AI error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const Style = data.ai_score_label ? labelStyle[data.ai_score_label] : null;

  return (
    <Card className="p-5 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Insights</h3>
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          {data.ai_summary ? "Refresh" : "Generate"}
        </Button>
      </div>
      {!data.ai_summary && !loading && (
        <p className="text-sm text-muted-foreground">Click Generate to get an AI lead score, summary, and recommended next action.</p>
      )}
      {Style && (
        <div className="mb-3">
          <Badge variant="outline" className={Style.cls}>
            <Style.icon className="h-3 w-3 mr-1" /> {data.ai_score_label} Lead
          </Badge>
        </div>
      )}
      {data.ai_summary && (
        <div className="mb-3">
          <div className="text-xs uppercase text-muted-foreground mb-1">Summary</div>
          <p className="text-sm">{data.ai_summary}</p>
        </div>
      )}
      {data.ai_next_action && (
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">Next Best Action</div>
          <p className="text-sm font-medium text-primary">{data.ai_next_action}</p>
        </div>
      )}
    </Card>
  );
}
