import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, X, Sparkles, TrendingUp, Mail, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { label: "Analyze pipeline", icon: TrendingUp, prompt: "Analyze my sales pipeline performance" },
  { label: "Prioritize leads", icon: Users, prompt: "Which leads should I prioritize this week?" },
  { label: "Draft follow-up", icon: Mail, prompt: "Draft a follow-up email for a stalled deal" },
  { label: "Plan my day", icon: Calendar, prompt: "Build a focused action plan for today" },
];

export const FloatingAIButton = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on public/auth pages and on the assistant page itself
  const hidden = ["/", "/auth", "/reset-password", "/terms", "/privacy", "/ai-assistant"].includes(
    location.pathname
  );
  if (hidden) return null;

  const go = (prompt?: string) => {
    setOpen(false);
    navigate("/ai-assistant", prompt ? { state: { prompt } } : undefined);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <Card className="w-72 p-3 shadow-2xl border-primary/30 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-primary" />
              SIMPLIFY AI
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => go(a.prompt)}
                className="w-full flex items-center gap-2 text-left text-sm px-2 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <a.icon className="w-4 h-4 text-primary" />
                {a.label}
              </button>
            ))}
            <Button className="w-full mt-2 gradient-primary text-primary-foreground" size="sm" onClick={() => go()}>
              Open AI Assistant
            </Button>
          </div>
        </Card>
      )}
      <Button
        onClick={() => setOpen((v) => !v)}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-xl gradient-primary text-primary-foreground hover:scale-105 transition-transform",
          open && "rotate-90"
        )}
        aria-label="AI Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </Button>
    </div>
  );
};
