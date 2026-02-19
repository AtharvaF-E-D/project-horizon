import { useState, useRef, useEffect } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Smile,
  FileText,
  Plus,
  Check,
  CheckCheck,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  id: number;
  name: string;
  company: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
  phone: string;
}

interface Message {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  status: "sending" | "sent" | "delivered" | "read";
}

interface Template {
  id: number;
  name: string;
  content: string;
  category: string;
}

const initialConversations: Conversation[] = [
  { id: 1, name: "John Smith", company: "Tech Corp", lastMessage: "Thanks for the info!", time: "2m ago", unread: 2, avatar: "JS", online: true, phone: "+1 555-0101" },
  { id: 2, name: "Sarah Johnson", company: "Marketing Inc", lastMessage: "Can we schedule a call?", time: "15m ago", unread: 0, avatar: "SJ", online: true, phone: "+1 555-0102" },
  { id: 3, name: "Mike Wilson", company: "Sales Co", lastMessage: "Looking forward to it", time: "1h ago", unread: 1, avatar: "MW", online: false, phone: "+1 555-0103" },
  { id: 4, name: "Emily Brown", company: "Design Studio", lastMessage: "Perfect, see you then", time: "2h ago", unread: 0, avatar: "EB", online: false, phone: "+1 555-0104" },
  { id: 5, name: "David Lee", company: "Consulting Ltd", lastMessage: "I'll send the details", time: "3h ago", unread: 0, avatar: "DL", online: true, phone: "+1 555-0105" },
];

const initialMessages: Message[] = [
  { id: 1, sender: "them", text: "Hi! I'm interested in your CRM solution", time: "10:30 AM", status: "read" },
  { id: 2, sender: "me", text: "Great! I'd be happy to help. What specific features are you looking for?", time: "10:32 AM", status: "read" },
  { id: 3, sender: "them", text: "Mainly lead management and email campaigns", time: "10:35 AM", status: "read" },
  { id: 4, sender: "me", text: "Perfect! Our platform includes both. Would you like to schedule a demo?", time: "10:37 AM", status: "read" },
  { id: 5, sender: "them", text: "Yes, that would be great!", time: "10:40 AM", status: "read" },
  { id: 6, sender: "me", text: "Excellent! I'll send you a calendar link shortly", time: "10:41 AM", status: "delivered" },
];

const messageTemplates: Template[] = [
  { id: 1, name: "Welcome", content: "Hi! Thanks for your interest. How can I help you today?", category: "Greeting" },
  { id: 2, name: "Schedule Demo", content: "I'd be happy to schedule a demo. When works best for you?", category: "Sales" },
  { id: 3, name: "Pricing Info", content: "Let me send you more information about our pricing plans. We have options starting from $29/month.", category: "Sales" },
  { id: 4, name: "Follow Up", content: "Hi! Just following up on our previous conversation. Do you have any questions?", category: "Follow-up" },
  { id: 5, name: "Thank You", content: "Thank you for choosing us! We're excited to have you on board.", category: "General" },
  { id: 6, name: "Out of Office", content: "Thanks for reaching out! I'm currently away but will get back to you within 24 hours.", category: "General" },
];

export default function WhatsApp() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(conversations[0]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: "me",
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "sending"
      };
      
      setMessages([...messages, newMessage]);
      setMessageText("");
      
      // Simulate message being sent
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id ? { ...msg, status: "sent" } : msg
          )
        );
      }, 500);

      // Simulate delivery
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
          )
        );
      }, 1500);

      // Update conversation last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: messageText, time: "Just now" }
            : conv
        )
      );

      toast.success("Message sent");
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setMessageText(template.content);
    setShowTemplates(false);
    toast.info(`Template "${template.name}" selected`);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Clear unread count
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation.id ? { ...conv, unread: 0 } : conv
      )
    );
  };

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-muted-foreground" />;
      case "sent":
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />

      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                WhatsApp Messaging
              </h1>
              <p className="text-muted-foreground mt-2">
                Connect with leads through WhatsApp
              </p>
            </div>
            <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <FileText className="w-4 h-4" />
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Message Templates</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {["Greeting", "Sales", "Follow-up", "General"].map((category) => (
                    <div key={category}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">{category}</h3>
                      <div className="grid gap-2">
                        {messageTemplates
                          .filter((t) => t.category === category)
                          .map((template) => (
                            <Card
                              key={template.id}
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleTemplateSelect(template)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{template.name}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {template.content}
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    Use
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Main Chat Interface */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[calc(100vh-250px)]">
            {/* Conversations List */}
            <Card className="md:col-span-4 flex flex-col h-80 md:h-auto">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversations
                  <Badge variant="secondary" className="ml-auto">
                    {conversations.filter(c => c.unread > 0).length} unread
                  </Badge>
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
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-accent ${
                          selectedConversation.id === conversation.id 
                            ? "bg-accent border-l-4 border-primary" 
                            : ""
                        }`}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {conversation.avatar}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                          )}
                        </div>
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
            <Card className="md:col-span-8 flex flex-col h-96 md:h-auto">
              {/* Chat Header */}
              <CardHeader className="border-b py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {selectedConversation.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {selectedConversation.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedConversation.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.online ? (
                          <span className="text-green-500">Online</span>
                        ) : (
                          selectedConversation.company
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toast.info("Starting voice call...")}>
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toast.info("Starting video call...")}>
                      <Video className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Contact</DropdownMenuItem>
                        <DropdownMenuItem>Search Messages</DropdownMenuItem>
                        <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Block Contact</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                          className={`max-w-[70%] rounded-2xl p-3 ${
                            message.sender === "me"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-accent text-accent-foreground rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            message.sender === "me" ? "justify-end" : ""
                          }`}>
                            <span className="text-xs opacity-70">{message.time}</span>
                            {message.sender === "me" && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Quick Templates */}
              <div className="border-t px-4 py-3">
                <p className="text-xs text-muted-foreground mb-2">Quick Templates</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {messageTemplates.slice(0, 4).map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateSelect(template)}
                      className="whitespace-nowrap text-xs"
                    >
                      {template.name}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                    className="whitespace-nowrap text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    More
                  </Button>
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2 items-end">
                  <Button variant="ghost" size="icon" className="shrink-0">
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
                    className="resize-none min-h-[44px] max-h-32"
                    rows={1}
                  />
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage} 
                    size="icon"
                    className="shrink-0"
                    disabled={!messageText.trim()}
                  >
                    <Send className="w-4 h-4" />
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
