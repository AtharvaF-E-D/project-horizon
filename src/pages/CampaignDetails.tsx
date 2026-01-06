import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Send,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  Eye,
  MousePointer,
  Users,
  Star,
  CheckCircle2,
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string | null;
  is_default: boolean | null;
}

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  tags: string[];
}

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [campaignType, setCampaignType] = useState("email");
  const [status, setStatus] = useState("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  
  // Templates and subscribers
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [subscriberFilter, setSubscriberFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("all");

  useEffect(() => {
    fetchTemplates();
    fetchSubscribers();
    if (id && id !== "new") {
      fetchCampaign();
    }
  }, [id]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("email_templates")
      .select("*")
      .order("is_default", { ascending: false });
    setTemplates(data || []);
  };

  const fetchSubscribers = async () => {
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setSubscribers(data || []);
  };

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setName(data.name);
        setSubject(data.subject || "");
        setContent(data.content || "");
        setCampaignType(data.campaign_type);
        setStatus(data.status);
        setScheduledAt(data.scheduled_at ? data.scheduled_at.slice(0, 16) : "");
        setRecipientCount(data.recipient_count || 0);
        setOpenCount(data.open_count || 0);
        setClickCount(data.click_count || 0);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load campaign",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (newStatus?: string) => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const campaignData = {
        name,
        subject: subject || null,
        content: content || null,
        campaign_type: campaignType,
        status: newStatus || status,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        recipient_count: selectedSubscribers.length || recipientCount,
        user_id: user.id,
      };

      if (id === "new") {
        const { error } = await supabase.from("campaigns").insert(campaignData);
        if (error) throw error;
        toast({ title: "Success", description: "Campaign created successfully" });
        navigate("/campaigns");
      } else {
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", id);
        if (error) throw error;
        toast({ title: "Success", description: "Campaign updated successfully" });
        if (newStatus) setStatus(newStatus);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Campaign deleted successfully" });
      navigate("/campaigns");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setContent(template.content);
    toast({
      title: "Template Applied",
      description: `"${template.name}" template has been applied`,
    });
  };

  const toggleSubscriber = (subscriberId: string) => {
    setSelectedSubscribers(prev => 
      prev.includes(subscriberId) 
        ? prev.filter(id => id !== subscriberId)
        : [...prev, subscriberId]
    );
  };

  const selectAllSubscribers = () => {
    const filtered = filteredSubscribers;
    const allSelected = filtered.every(s => selectedSubscribers.includes(s.id));
    if (allSelected) {
      setSelectedSubscribers(prev => prev.filter(id => !filtered.some(s => s.id === id)));
    } else {
      setSelectedSubscribers(prev => [...new Set([...prev, ...filtered.map(s => s.id)])]);
    }
  };

  // Get all unique tags
  const allTags = [...new Set(subscribers.flatMap(s => s.tags || []))];

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      sub.email.toLowerCase().includes(subscriberFilter.toLowerCase()) ||
      (sub.first_name?.toLowerCase().includes(subscriberFilter.toLowerCase())) ||
      (sub.last_name?.toLowerCase().includes(subscriberFilter.toLowerCase()));
    const matchesTag = tagFilter === "all" || sub.tags?.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8 ml-64">
          <div className="max-w-4xl">
            <Button
              variant="ghost"
              onClick={() => navigate("/campaigns")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {id === "new" ? "Create Campaign" : "Edit Campaign"}
                </h1>
                {id !== "new" && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {recipientCount} recipients
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {openCount} opens
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-4 h-4" /> {clickCount} clicks
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {id !== "new" && status === "draft" && (
                  <Button
                    variant="outline"
                    onClick={() => handleSave("scheduled")}
                    disabled={loading}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                )}
                {id !== "new" && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <Tabs defaultValue="content" className="space-y-6">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="recipients">
                  Recipients
                  {selectedSubscribers.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSubscribers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <Card className="p-6 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Spring Sale Announcement"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Campaign Type</Label>
                      <Select value={campaignType} onValueChange={setCampaignType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" /> Email
                            </div>
                          </SelectItem>
                          <SelectItem value="sms">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> SMS
                            </div>
                          </SelectItem>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" /> WhatsApp
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {campaignType === "email" && (
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject..."
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="content">
                      {campaignType === "email" ? "Email Body" : "Message Content"}
                    </Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your message content here..."
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{first_name}}"}, {"{{last_name}}"}, {"{{email}}"} for personalization
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => handleSave()} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Save as Draft
                    </Button>
                    {selectedSubscribers.length > 0 && (
                      <Button 
                        variant="default" 
                        onClick={() => handleSave("sent")} 
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to {selectedSubscribers.length} recipients
                      </Button>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="templates">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Your Email Templates</h3>
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No templates yet</p>
                      <Button variant="link" onClick={() => navigate("/email-templates")}>
                        Create your first template
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {templates.map((template) => (
                        <Card
                          key={template.id}
                          className="p-4 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => applyTemplate(template)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-primary" />
                            <h4 className="font-medium">{template.name}</h4>
                            {template.is_default && (
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <Badge variant="outline" className="mb-2">{template.category}</Badge>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.subject}
                          </p>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="recipients">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Select Recipients</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {selectedSubscribers.length} selected
                      </Badge>
                      <Button variant="outline" size="sm" onClick={selectAllSubscribers}>
                        {filteredSubscribers.every(s => selectedSubscribers.includes(s.id)) 
                          ? "Deselect All" 
                          : "Select All"
                        }
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <Input
                      placeholder="Search subscribers..."
                      value={subscriberFilter}
                      onChange={(e) => setSubscriberFilter(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        {allTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {subscribers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active subscribers</p>
                      <Button variant="link" onClick={() => navigate("/subscribers")}>
                        Add subscribers
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredSubscribers.map((subscriber) => (
                        <div
                          key={subscriber.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedSubscribers.includes(subscriber.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleSubscriber(subscriber.id)}
                        >
                          <Checkbox
                            checked={selectedSubscribers.includes(subscriber.id)}
                            onCheckedChange={() => toggleSubscriber(subscriber.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">
                              {subscriber.first_name || subscriber.last_name
                                ? `${subscriber.first_name || ""} ${subscriber.last_name || ""}`.trim()
                                : subscriber.email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {subscriber.email}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {subscriber.tags?.slice(0, 2).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {selectedSubscribers.includes(subscriber.id) && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="p-6 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scheduledAt">Schedule Send</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to send immediately when activated
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Campaign Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-muted-foreground">Recipients</div>
                        <div className="text-xl font-bold">{selectedSubscribers.length || recipientCount}</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-muted-foreground">Status</div>
                        <div className="text-xl font-bold capitalize">{status}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CampaignDetails;