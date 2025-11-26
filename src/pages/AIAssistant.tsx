import { useState } from "react";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Sparkles, TrendingUp, Users, Calendar, Mail } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI sales assistant. I can help you analyze leads, suggest next actions, draft emails, and provide insights on your pipeline. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");

  const suggestions = [
    { icon: TrendingUp, text: "Analyze my top 5 leads", color: "text-primary" },
    { icon: Users, text: "Find leads that need follow-up", color: "text-secondary" },
    { icon: Calendar, text: "Schedule meetings for this week", color: "text-accent" },
    { icon: Mail, text: "Draft a follow-up email", color: "text-purple-500" },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const aiMessage: Message = {
      id: messages.length + 2,
      role: "assistant",
      content: "I'm analyzing your request and preparing insights. In a real implementation, this would connect to an AI service to provide intelligent responses based on your CRM data.",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage, aiMessage]);
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-16 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
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
              <Card className="border-2 border-primary/20 h-[calc(100vh-16rem)] flex flex-col card-hover">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 animate-fade-in ${
                          message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === "assistant"
                              ? "bg-gradient-primary"
                              : "bg-gradient-secondary"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <Bot className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-white font-semibold">U</span>
                          )}
                        </div>
                        <div
                          className={`flex-1 max-w-[80%] ${
                            message.role === "user" ? "text-right" : ""
                          }`}
                        >
                          <div
                            className={`inline-block p-4 rounded-2xl ${
                              message.role === "assistant"
                                ? "bg-muted/50 border border-primary/20"
                                : "bg-gradient-primary text-white"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything about your leads and sales..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      className="bg-gradient-primary text-white"
                      disabled={!input.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Suggestions Panel */}
            <div className="space-y-6">
              <Card className="border-2 border-secondary/20 card-hover animate-fade-in" style={{ animationDelay: "200ms" }}>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start hover-scale"
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      style={{ animationDelay: `${(index + 3) * 100}ms` }}
                    >
                      <suggestion.icon className={`w-4 h-4 mr-2 ${suggestion.color}`} />
                      {suggestion.text}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/20 card-hover animate-fade-in" style={{ animationDelay: "300ms" }}>
                <CardHeader>
                  <CardTitle className="text-lg">AI Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge className="bg-gradient-primary text-white mr-2 mb-2">Lead Scoring</Badge>
                  <Badge className="bg-gradient-secondary text-white mr-2 mb-2">Email Writing</Badge>
                  <Badge className="bg-gradient-accent text-white mr-2 mb-2">Pipeline Analysis</Badge>
                  <Badge className="bg-purple-500 text-white mr-2 mb-2">Smart Scheduling</Badge>
                  <Badge className="bg-gradient-primary text-white mr-2 mb-2">Task Automation</Badge>
                  <Badge className="bg-gradient-secondary text-white mr-2 mb-2">Insights</Badge>
                </CardContent>
              </Card>

              <Card className="bg-gradient-subtle border-2 border-primary/20 card-hover animate-fade-in" style={{ animationDelay: "400ms" }}>
                <CardHeader>
                  <CardTitle className="text-lg">Pro Tip</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ask me to analyze specific leads by name or company, and I'll provide detailed insights and recommendations.
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
