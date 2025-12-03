import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

const emailTemplates = [
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to {{company_name}}!",
    content: `Hi {{first_name}},

Welcome to {{company_name}}! We're excited to have you on board.

Here's what you can expect:
- Regular updates about our products
- Exclusive offers and discounts
- Tips and resources to help you succeed

If you have any questions, feel free to reach out.

Best regards,
The {{company_name}} Team`,
  },
  {
    id: "follow-up",
    name: "Follow-up",
    subject: "Following up on our conversation",
    content: `Hi {{first_name}},

I wanted to follow up on our recent conversation about {{topic}}.

Have you had a chance to review the information I sent? I'd love to answer any questions you might have.

Let me know if you'd like to schedule a call to discuss further.

Best,
{{sender_name}}`,
  },
  {
    id: "promotion",
    name: "Promotional",
    subject: "Special Offer Just for You!",
    content: `Hi {{first_name}},

We have an exclusive offer just for you!

For a limited time, get {{discount}}% off on all our products.

Use code: {{promo_code}}

Don't miss out - this offer expires on {{expiry_date}}.

Shop now!

Best,
The {{company_name}} Team`,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    subject: "{{company_name}} Monthly Update",
    content: `Hi {{first_name}},

Here's your monthly update from {{company_name}}:

📰 News & Updates
- [Update 1]
- [Update 2]

💡 Tips & Resources
- [Tip 1]
- [Tip 2]

🎯 Upcoming Events
- [Event 1]
- [Event 2]

Stay tuned for more updates!

Best,
The {{company_name}} Team`,
  },
];

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

  useEffect(() => {
    if (id && id !== "new") {
      fetchCampaign();
    }
  }, [id]);

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
      const campaignData = {
        name,
        subject: subject || null,
        content: content || null,
        campaign_type: campaignType,
        status: newStatus || status,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
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

  const applyTemplate = (templateId: string) => {
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
      toast({
        title: "Template Applied",
        description: `"${template.name}" template has been applied`,
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      case "whatsapp":
        return <Phone className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

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
                      Use {"{{first_name}}"}, {"{{company_name}}"}, etc. for personalization
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
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="templates">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Email Templates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {emailTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="p-4 cursor-pointer hover:border-primary transition-colors"
                        onClick={() => applyTemplate(template.id)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-primary" />
                          <h4 className="font-medium">{template.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.subject}
                        </p>
                      </Card>
                    ))}
                  </div>
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
                    <h4 className="font-medium mb-2">Recipient Selection</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Recipients will be selected from your contacts and leads based on filters.
                      This feature will be available in a future update.
                    </p>
                    <Button variant="outline" disabled>
                      <Users className="w-4 h-4 mr-2" />
                      Select Recipients
                    </Button>
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
