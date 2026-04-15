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
  Clock,
  Loader2,
  BotMessageSquare,
  X,
  Image as ImageIcon,
  File,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "react-router-dom";

interface Conversation {
  id: string;
  contact_name: string;
  contact_company: string | null;
  contact_phone: string;
  contact_avatar: string | null;
  is_online: boolean;
  unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
}

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  status: "sending" | "sent" | "delivered" | "read";
  created_at: string;
}

interface Template {
  id: number;
  name: string;
  content: string;
  category: string;
}

interface SearchResult {
  message: Message;
  conversation: Conversation;
}

const messageTemplates: Template[] = [
  { id: 1, name: "Welcome", content: "Hi! Thanks for your interest. How can I help you today?", category: "Greeting" },
  { id: 2, name: "Schedule Demo", content: "I'd be happy to schedule a demo. When works best for you?", category: "Sales" },
  { id: 3, name: "Pricing Info", content: "Let me send you more information about our pricing plans. We have options starting from $29/month.", category: "Sales" },
  { id: 4, name: "Follow Up", content: "Hi! Just following up on our previous conversation. Do you have any questions?", category: "Follow-up" },
  { id: 5, name: "Thank You", content: "Thank you for choosing us! We're excited to have you on board.", category: "General" },
  { id: 6, name: "Out of Office", content: "Thanks for reaching out! I'm currently away but will get back to you within 24 hours.", category: "General" },
];

// Typing indicator component
const TypingIndicator = ({ contactName }: { contactName: string }) => (
  <div className="flex justify-start">
    <div className="max-w-[70%] rounded-2xl rounded-bl-md bg-accent text-accent-foreground p-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-xs text-muted-foreground">{contactName} is typing...</span>
      </div>
    </div>
  </div>
);

export default function WhatsApp() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [newConvoName, setNewConvoName] = useState("");
  const [newConvoPhone, setNewConvoPhone] = useState("");
  const [newConvoCompany, setNewConvoCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle contact_id from URL params (CRM integration)
  useEffect(() => {
    if (!user) return;
    const contactId = searchParams.get("contact_id");
    if (!contactId) return;

    const initFromContact = async () => {
      // Fetch contact details
      const { data: contact } = await supabase
        .from("contacts")
        .select("first_name, last_name, phone, companies(name)")
        .eq("id", contactId)
        .single();

      if (!contact || !contact.phone) {
        toast.error("Contact has no phone number");
        return;
      }

      const contactName = `${contact.first_name} ${contact.last_name}`;
      const companyName = (contact.companies as any)?.name || null;

      // Check if conversation already exists for this phone
      const { data: existing } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("contact_phone", contact.phone)
        .maybeSingle();

      if (existing) {
        setSelectedConversation(existing as Conversation);
      } else {
        // Create new conversation
        const initials = contactName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        const { data: newConvo } = await supabase
          .from("whatsapp_conversations")
          .insert({
            user_id: user.id,
            contact_name: contactName,
            contact_phone: contact.phone,
            contact_company: companyName,
            contact_avatar: initials,
            is_online: false,
            unread_count: 0,
          })
          .select()
          .single();

        if (newConvo) {
          setConversations(prev => [newConvo as Conversation, ...prev]);
          setSelectedConversation(newConvo as Conversation);
          toast.success(`Conversation started with ${contactName}`);
        }
      }
    };

    initFromContact();
  }, [user, searchParams]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });
      if (!error && data) {
        setConversations(data as Conversation[]);
        if (data.length > 0 && !selectedConversation && !searchParams.get("contact_id")) {
          setSelectedConversation(data[0] as Conversation);
        }
      }
      setLoading(false);
    };
    fetchConversations();
  }, [user]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversation || !user) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });
      if (!error && data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          sender: m.sender as "me" | "them",
          text: m.text,
          status: m.status as Message["status"],
          created_at: m.created_at,
        })));
      }
    };
    fetchMessages();

    // Mark unread as 0
    if (selectedConversation.unread_count > 0) {
      supabase
        .from("whatsapp_conversations")
        .update({ unread_count: 0 })
        .eq("id", selectedConversation.id)
        .then(() => {
          setConversations(prev =>
            prev.map(c => c.id === selectedConversation.id ? { ...c, unread_count: 0 } : c)
          );
        });
    }
  }, [selectedConversation?.id, user]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;
    const channel = supabase
      .channel(`wa-messages-${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const m = payload.new as any;
          setMessages(prev => {
            if (prev.find(msg => msg.id === m.id)) return prev;
            return [...prev, {
              id: m.id,
              sender: m.sender,
              text: m.text,
              status: m.status,
              created_at: m.created_at,
            }];
          });
          // Hide typing indicator when message arrives
          if (m.sender === "them") {
            setIsTyping(false);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConversation?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.contact_company || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Global message search
  const handleGlobalSearch = async () => {
    if (!globalSearchQuery.trim() || !user) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("user_id", user.id)
        .ilike("text", `%${globalSearchQuery.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Map messages to their conversations
      const convoIds = [...new Set((data || []).map((m: any) => m.conversation_id))];
      const { data: convos } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .in("id", convoIds);

      const convoMap = new Map((convos || []).map((c: any) => [c.id, c as Conversation]));

      const results: SearchResult[] = (data || [])
        .map((m: any) => ({
          message: {
            id: m.id,
            sender: m.sender,
            text: m.text,
            status: m.status,
            created_at: m.created_at,
          },
          conversation: convoMap.get(m.conversation_id)!,
        }))
        .filter((r: SearchResult) => r.conversation);

      setGlobalSearchResults(results);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return;

    const text = messageText.trim();
    setMessageText("");

    // Optimistic UI
    const tempId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: tempId,
      sender: "me",
      text,
      status: "sending",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: selectedConversation.id,
        user_id: user.id,
        sender: "me",
        text,
        status: "sent",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return;
    }

    // Replace optimistic msg with real one
    setMessages(prev => prev.map(m => m.id === tempId ? {
      id: data.id,
      sender: "me",
      text: data.text,
      status: data.status as Message["status"],
      created_at: data.created_at,
    } : m));

    // Update conversation last_message
    await supabase
      .from("whatsapp_conversations")
      .update({ last_message: text, last_message_at: new Date().toISOString() })
      .eq("id", selectedConversation.id);

    setConversations(prev =>
      prev.map(c =>
        c.id === selectedConversation.id
          ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
          : c
      )
    );

    toast.success("Message sent");
  };

  const handleCreateConversation = async () => {
    if (!newConvoName.trim() || !newConvoPhone.trim() || !user) return;

    const initials = newConvoName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    const { data, error } = await supabase
      .from("whatsapp_conversations")
      .insert({
        user_id: user.id,
        contact_name: newConvoName.trim(),
        contact_phone: newConvoPhone.trim(),
        contact_company: newConvoCompany.trim() || null,
        contact_avatar: initials,
        is_online: false,
        unread_count: 0,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create conversation");
      return;
    }

    const newConvo = data as Conversation;
    setConversations(prev => [newConvo, ...prev]);
    setSelectedConversation(newConvo);
    setShowNewConvo(false);
    setNewConvoName("");
    setNewConvoPhone("");
    setNewConvoCompany("");
    toast.success("Conversation created");
  };

  const handleTemplateSelect = (template: Template) => {
    setMessageText(template.content);
    setShowTemplates(false);
    toast.info(`Template "${template.name}" selected`);
  };

  const simulatedReplies = [
    "Sure, I'd be happy to discuss that further!",
    "Thanks for getting back to me. Let me check on that.",
    "That sounds great! When can we schedule a call?",
    "I've reviewed the proposal and I have a few questions.",
    "Perfect, I'll send over the documents shortly.",
    "Can you share more details about the pricing?",
    "We're very interested. Let's move forward with this.",
    "I need to discuss this with my team first. I'll get back to you.",
    "Could you send me a demo link?",
    "That works for us. Let's finalize the agreement.",
  ];

  const handleSimulateReply = async () => {
    if (!selectedConversation || !user) return;

    const replyText = simulatedReplies[Math.floor(Math.random() * simulatedReplies.length)];

    // Show typing indicator
    setIsTyping(true);
    toast.info(`${selectedConversation.contact_name} is typing...`);

    setTimeout(async () => {
      const { error } = await supabase
        .from("whatsapp_messages")
        .insert({
          conversation_id: selectedConversation.id,
          user_id: user.id,
          sender: "them",
          text: replyText,
          status: "read",
        });

      if (error) {
        toast.error("Failed to simulate reply");
        setIsTyping(false);
        return;
      }

      // Update conversation metadata
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_message: replyText,
          last_message_at: new Date().toISOString(),
          unread_count: (selectedConversation.unread_count || 0) + 1,
        })
        .eq("id", selectedConversation.id);

      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, last_message: replyText, last_message_at: new Date().toISOString() }
            : c
        )
      );

      setIsTyping(false);
      toast.success(`${selectedConversation.contact_name} replied!`);
    }, 2500);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return date.toLocaleDateString();
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

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-yellow-300/50 font-semibold">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <DashboardNav />
        <main className="ml-64 pt-20 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

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
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setShowGlobalSearch(true)}>
                <Search className="w-4 h-4" />
                Search Messages
              </Button>
              <Dialog open={showNewConvo} onOpenChange={setShowNewConvo}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Conversation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Contact Name *</Label>
                      <Input value={newConvoName} onChange={e => setNewConvoName(e.target.value)} placeholder="John Smith" />
                    </div>
                    <div>
                      <Label>Phone Number *</Label>
                      <Input value={newConvoPhone} onChange={e => setNewConvoPhone(e.target.value)} placeholder="+1 555-0101" />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input value={newConvoCompany} onChange={e => setNewConvoCompany(e.target.value)} placeholder="Acme Inc" />
                    </div>
                    <Button onClick={handleCreateConversation} disabled={!newConvoName.trim() || !newConvoPhone.trim()} className="w-full">
                      Create Conversation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
          </div>

          {/* Global Message Search Dialog */}
          <Dialog open={showGlobalSearch} onOpenChange={setShowGlobalSearch}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Search All Messages</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages across all conversations..."
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleGlobalSearch} disabled={searching || !globalSearchQuery.trim()}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
                <ScrollArea className="max-h-[50vh]">
                  {globalSearchResults.length === 0 && globalSearchQuery && !searching && (
                    <p className="text-sm text-muted-foreground text-center py-8">No messages found</p>
                  )}
                  <div className="space-y-2">
                    {globalSearchResults.map((result) => (
                      <Card
                        key={result.message.id}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          setSelectedConversation(result.conversation);
                          setShowGlobalSearch(false);
                          setGlobalSearchQuery("");
                          setGlobalSearchResults([]);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {result.conversation.contact_avatar || result.conversation.contact_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold text-sm">{result.conversation.contact_name}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(result.message.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {result.message.sender === "me" ? "You: " : ""}
                              {highlightMatch(result.message.text, globalSearchQuery)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          {/* Main Chat Interface */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[calc(100vh-250px)]">
            {/* Conversations List */}
            <Card className="md:col-span-4 flex flex-col h-80 md:h-auto">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversations
                  <Badge variant="secondary" className="ml-auto">
                    {conversations.filter(c => c.unread_count > 0).length} unread
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
                    {filteredConversations.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No conversations yet. Start one!
                      </p>
                    )}
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-accent ${
                          selectedConversation?.id === conversation.id
                            ? "bg-accent border-l-4 border-primary"
                            : ""
                        }`}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {conversation.contact_avatar || conversation.contact_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.is_online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold truncate">{conversation.contact_name}</p>
                            <span className="text-xs text-muted-foreground">
                              {conversation.last_message_at ? formatTime(conversation.last_message_at) : ""}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conversation.contact_company}</p>
                          <p className="text-sm text-muted-foreground truncate">{conversation.last_message || "No messages yet"}</p>
                        </div>
                        {conversation.unread_count > 0 && (
                          <Badge className="bg-primary text-primary-foreground">
                            {conversation.unread_count}
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
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {selectedConversation.contact_avatar || selectedConversation.contact_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {selectedConversation.is_online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{selectedConversation.contact_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {isTyping ? (
                              <span className="text-primary">typing...</span>
                            ) : selectedConversation.is_online ? (
                              <span className="text-green-500">Online</span>
                            ) : (
                              selectedConversation.contact_company || selectedConversation.contact_phone
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
                            <DropdownMenuItem onClick={() => setShowGlobalSearch(true)}>
                              <Search className="w-4 h-4 mr-2" />
                              Search Messages
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSimulateReply} className="gap-2">
                              <BotMessageSquare className="w-4 h-4" />
                              Simulate Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                await supabase.from("whatsapp_messages").delete().eq("conversation_id", selectedConversation.id);
                                setMessages([]);
                                toast.success("Chat cleared");
                              }}
                            >
                              Clear Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={async () => {
                                await supabase.from("whatsapp_conversations").delete().eq("id", selectedConversation.id);
                                setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
                                setSelectedConversation(conversations.find(c => c.id !== selectedConversation.id) || null);
                                setMessages([]);
                                toast.success("Conversation deleted");
                              }}
                            >
                              Delete Conversation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-6">
                      <div className="space-y-4">
                        {messages.length === 0 && !isTyping && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No messages yet. Send the first one!
                          </p>
                        )}
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
                              <div className={`flex items-center gap-1 mt-1 ${message.sender === "me" ? "justify-end" : ""}`}>
                                <span className="text-xs opacity-70">
                                  {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {message.sender === "me" && getStatusIcon(message.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {isTyping && <TypingIndicator contactName={selectedConversation.contact_name} />}
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
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation or start a new one</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
