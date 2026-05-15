import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  recentMessages: { sender: string; text: string }[];
  onPick: (text: string) => void;
}

export function SuggestedReplies({ recentMessages, onPick }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<string[]>([]);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: { action: "suggest_replies", payload: { messages: recentMessages.slice(-8) } },
      });
      if (error) throw error;
      setReplies(data?.result?.replies || []);
    } catch (e: any) {
      toast({ title: "AI error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={generate} disabled={loading || recentMessages.length === 0} className="h-7 text-xs">
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1 text-primary" />}
          AI Suggest
        </Button>
        {replies.map((r, i) => (
          <button
            key={i}
            onClick={() => { onPick(r); setReplies([]); }}
            className="text-xs px-3 py-1 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
