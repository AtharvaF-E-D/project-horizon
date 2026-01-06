import { useState, useRef, useEffect } from "react";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Sparkles, TrendingUp, Users, Calendar, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const AIAssistant = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm SIMPLIFY AI, your intelligent sales assistant. I can help you analyze leads, suggest follow-up actions, draft emails, and provide pipeline insights. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { icon: TrendingUp, text: "Analyze my sales pipeline performance", color: "text-primary" },
    { icon: Users, text: "What leads should I prioritize this week?", color: "text-secondary" },
    { icon: Calendar, text: "Help me plan my follow-up schedule", color: "text-accent" },
    { icon: Mail, text: "Draft a professional follow-up email", color: "text-purple-500" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      if (response.status === 402) {
        throw new Error("AI credits depleted. Please add credits to your workspace.");
      }
      throw new Error(errorData.error || "Failed to get AI response");
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    const assistantId = `assistant-${Date.now()}`;

    // Add empty assistant message
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
    ]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              )
            );
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(updatedMessages);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI Assistant</h1>
                <p className="text-muted-foreground">Your intelligent sales companion</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-primary/20 h-[calc(100vh-16rem)] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Chat with SIMPLIFY AI
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === "assistant"
                              ? "gradient-primary"
                              : "gradient-secondary"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <Bot className="w-5 h-5 text-primary-foreground" />
                          ) : (
                            <span className="text-secondary-foreground font-semibold">U</span>
                          )}
                        </div>
                        <div
                          className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}
                        >
                          <div
                            className={`inline-block p-4 rounded-2xl ${
                              message.role === "assistant"
                                ? "bg-muted/50 border border-primary/20 text-foreground"
                                : "gradient-primary text-primary-foreground"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content || (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything about your leads and sales..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSend}
                      className="gradient-primary text-primary-foreground"
                      disabled={!input.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Suggestions Panel */}
            <div className="space-y-6">
              <Card className="border-2 border-secondary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      disabled={isLoading}
                    >
                      <suggestion.icon className={`w-4 h-4 mr-2 flex-shrink-0 ${suggestion.color}`} />
                      <span className="text-sm">{suggestion.text}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg">AI Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge className="gradient-primary text-primary-foreground">Lead Scoring</Badge>
                  <Badge className="gradient-secondary text-secondary-foreground">Email Writing</Badge>
                  <Badge className="bg-accent text-accent-foreground">Pipeline Analysis</Badge>
                  <Badge className="bg-purple-500 text-white">Smart Scheduling</Badge>
                  <Badge className="gradient-primary text-primary-foreground">Task Automation</Badge>
                  <Badge className="gradient-secondary text-secondary-foreground">Insights</Badge>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Pro Tip</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ask me to draft emails, analyze your pipeline, or suggest follow-up strategies. I can help you work smarter and close more deals!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
