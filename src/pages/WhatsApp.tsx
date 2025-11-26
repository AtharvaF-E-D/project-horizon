import { useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Search, Send, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react";

const conversations = [
  { id: 1, name: "John Smith", company: "Tech Corp", lastMessage: "Thanks for the info!", time: "2m ago", unread: 2, avatar: "JS" },
  { id: 2, name: "Sarah Johnson", company: "Marketing Inc", lastMessage: "Can we schedule a call?", time: "15m ago", unread: 0, avatar: "SJ" },
  { id: 3, name: "Mike Wilson", company: "Sales Co", lastMessage: "Looking forward to it", time: "1h ago", unread: 1, avatar: "MW" },
  { id: 4, name: "Emily Brown", company: "Design Studio", lastMessage: "Perfect, see you then", time: "2h ago", unread: 0, avatar: "EB" },
  { id: 5, name: "David Lee", company: "Consulting Ltd", lastMessage: "I'll send the details", time: "3h ago", unread: 0, avatar: "DL" },
];

const messages = [
  { id: 1, sender: "them", text: "Hi! I'm interested in your CRM solution", time: "10:30 AM" },
  { id: 2, sender: "me", text: "Great! I'd be happy to help. What specific features are you looking for?", time: "10:32 AM" },
  { id: 3, sender: "them", text: "Mainly lead management and email campaigns", time: "10:35 AM" },
  { id: 4, sender: "me", text: "Perfect! Our platform includes both. Would you like to schedule a demo?", time: "10:37 AM" },
  { id: 5, sender: "them", text: "Yes, that would be great!", time: "10:40 AM" },
  { id: 6, sender: "me", text: "Excellent! I'll send you a calendar link shortly", time: "10:41 AM" },
];

const templates = [
  "Hi! Thanks for your interest. How can I help you today?",
  "I'd be happy to schedule a demo. When works best for you?",
  "Let me send you more information about our pricing.",
  "Thanks for reaching out! I'll get back to you shortly.",
];

export default function WhatsApp() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              WhatsApp Messaging
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect with leads through WhatsApp
            </p>
          </div>

          {/* Main Chat Interface */}
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
            {/* Conversations List */}
            <Card className="col-span-4 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversations
                </CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-4">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-smooth hover:bg-accent ${
                          selectedConversation.id === conversation.id ? "bg-accent" : ""
                        }`}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conversation.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold truncate">{conversation.name}</p>
                            <span className="text-xs text-muted-foreground">{conversation.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conversation.company}</p>
                          <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                        </div>
                        {conversation.unread > 0 && (
                          <Badge className="bg-primary text-primary-foreground">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="col-span-8 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedConversation.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedConversation.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedConversation.company}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender === "me"
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent text-accent-foreground"
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className="text-xs mt-1 opacity-70">{message.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Quick Templates */}
              <div className="border-t p-4">
                <p className="text-sm text-muted-foreground mb-2">Quick Templates</p>
                <div className="flex gap-2 overflow-x-auto">
                  {templates.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessageText(template)}
                      className="whitespace-nowrap"
                    >
                      {template.substring(0, 30)}...
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Textarea
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="resize-none"
                    rows={2}
                  />
                  <Button variant="ghost" size="icon">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleSendMessage} className="gap-2">
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
