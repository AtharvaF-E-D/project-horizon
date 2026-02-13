import { useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Search, MessageSquare, BookOpen, Video, Mail, Phone, ExternalLink, Send, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const faqs = [
  { q: "How do I import leads from a CSV file?", a: "Navigate to Data Import/Export from the sidebar, click 'Import Data', select your CSV file, map the columns to match the lead fields, and click 'Import'. The system supports CSV and Excel formats." },
  { q: "How do I set up email campaigns?", a: "Go to Campaigns from the sidebar, click 'New Campaign', choose your template, select your subscriber segment, compose your email, and schedule or send immediately." },
  { q: "Can I integrate with WhatsApp Business?", a: "Yes! Navigate to Settings > Integrations and connect your WhatsApp Business account. Once connected, you can send messages directly from the WhatsApp Messaging module." },
  { q: "How do I assign leads to team members?", a: "Open any lead detail page and use the 'Assigned To' field to select a team member. You can also use bulk actions from the Leads list to assign multiple leads at once." },
  { q: "How does the AI Assistant work?", a: "The AI Assistant analyzes your CRM data to provide insights, draft emails, suggest follow-up actions, and help with pipeline analysis. Simply type your question or use the quick action buttons." },
  { q: "How do I create custom deal stages?", a: "Go to Settings > Pipeline Configuration. You can add, remove, or reorder deal stages to match your sales process." },
  { q: "What reports are available?", a: "SIMPLIFY offers reports on revenue trends, sales pipeline, team performance, lead sources, conversion rates, and more. Visit the Reports & Analytics section for detailed insights." },
  { q: "How do I manage user roles and permissions?", a: "Admins can manage roles from the Roles page. There are five role levels: Owner, Admin, Manager, Agent, and Viewer, each with different access levels." },
];

const guides = [
  { title: "Getting Started with SIMPLIFY", description: "Learn the basics of setting up your CRM", icon: BookOpen, category: "Beginner" },
  { title: "Lead Management Best Practices", description: "Tips for effectively managing your leads", icon: BookOpen, category: "Leads" },
  { title: "Pipeline Optimization Guide", description: "Maximize your sales pipeline efficiency", icon: BookOpen, category: "Sales" },
  { title: "Email Campaign Strategies", description: "Create engaging email campaigns", icon: Mail, category: "Marketing" },
  { title: "Team Collaboration Tips", description: "Work better with your team in SIMPLIFY", icon: MessageSquare, category: "Team" },
  { title: "Advanced Analytics Guide", description: "Deep dive into your CRM analytics", icon: BookOpen, category: "Analytics" },
];

export default function HelpSupport() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmitTicket = () => {
    if (!subject || !message) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    toast({ title: "Ticket submitted", description: "Our support team will get back to you within 24 hours." });
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Help & Support</h1>
            <p className="text-muted-foreground">Find answers, learn features, and get help from our team</p>
            <div className="relative mt-6 max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search for help..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-12 text-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-hover text-center cursor-pointer"><CardContent className="p-6"><MessageSquare className="w-8 h-8 text-primary mx-auto mb-3" /><h3 className="font-semibold mb-1">Live Chat</h3><p className="text-sm text-muted-foreground">Chat with our support team</p></CardContent></Card>
            <Card className="card-hover text-center cursor-pointer"><CardContent className="p-6"><Mail className="w-8 h-8 text-secondary mx-auto mb-3" /><h3 className="font-semibold mb-1">Email Support</h3><p className="text-sm text-muted-foreground">support@simplify.com</p></CardContent></Card>
            <Card className="card-hover text-center cursor-pointer"><CardContent className="p-6"><Video className="w-8 h-8 text-accent mx-auto mb-3" /><h3 className="font-semibold mb-1">Video Tutorials</h3><p className="text-sm text-muted-foreground">Watch step-by-step guides</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Frequently Asked Questions</CardTitle></CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Submit a Ticket</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input placeholder="Brief description of your issue" value={subject} onChange={e => setSubject(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea placeholder="Describe your issue in detail..." value={message} onChange={e => setMessage(e.target.value)} rows={5} />
                  </div>
                  <Button onClick={handleSubmitTicket} className="w-full gradient-primary text-primary-foreground">
                    <Send className="w-4 h-4 mr-2" /> Submit Ticket
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Knowledge Base</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {guides.map((guide, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <guide.icon className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{guide.title}</p>
                        <p className="text-xs text-muted-foreground">{guide.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}