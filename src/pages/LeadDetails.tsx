import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Phone, Mail, Calendar, FileText, Upload, Send, Clock, MessageSquare, Bot } from "lucide-react";

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");

  // Mock lead data
  const lead = {
    id: id || "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@techcorp.com",
    phone: "+1 (555) 123-4567",
    company: "TechCorp Inc.",
    status: "Qualified",
    value: "$45,000",
    source: "Website",
  };

  const timeline = [
    { id: 1, type: "email", action: "Email sent", date: "2024-01-15 10:30 AM", user: "You" },
    { id: 2, type: "call", action: "Call made - Interested in demo", date: "2024-01-14 2:15 PM", user: "You" },
    { id: 3, type: "note", action: "Added note", date: "2024-01-13 4:45 PM", user: "You" },
    { id: 4, type: "created", action: "Lead created from website", date: "2024-01-10 9:00 AM", user: "System" },
  ];

  const aiNotes = [
    "High conversion probability (85%) based on engagement patterns",
    "Recommended next action: Schedule product demo within 48 hours",
    "Similar leads from this company have 3x higher conversion rate",
    "Best contact time: Tuesday-Thursday, 2-4 PM EST",
  ];

  const files = [
    { id: 1, name: "Product Proposal.pdf", size: "2.3 MB", date: "2024-01-14" },
    { id: 2, name: "Contract Template.docx", size: "1.1 MB", date: "2024-01-13" },
    { id: 3, name: "Company Profile.pdf", size: "3.5 MB", date: "2024-01-10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <DashboardNav />
      <main className="ml-64 pt-16 p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/leads")}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Info & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Header */}
            <Card className="border-2 border-primary/20 card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">{lead.name}</CardTitle>
                    <CardDescription className="text-lg mt-2">{lead.company}</CardDescription>
                  </div>
                  <Badge className="bg-gradient-primary text-white">{lead.status}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 text-secondary" />
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Value: {lead.value}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Source: {lead.source}</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="timeline" className="animate-fade-in">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="ai-notes">
                  <Bot className="w-4 h-4 mr-2" />
                  AI Insights
                </TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timeline.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex gap-4 animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                            {item.type === "email" && <Mail className="w-5 h-5 text-white" />}
                            {item.type === "call" && <Phone className="w-5 h-5 text-white" />}
                            {item.type === "note" && <MessageSquare className="w-5 h-5 text-white" />}
                            {item.type === "created" && <Clock className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1 pb-4 border-b border-border/50">
                            <p className="font-medium">{item.action}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.date} • {item.user}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-notes">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-6 h-6 text-primary" />
                      AI-Powered Insights
                    </CardTitle>
                    <CardDescription>Smart recommendations based on lead behavior</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiNotes.map((note, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gradient-subtle rounded-lg border border-primary/20 animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <p className="text-sm">{note}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Attached Files</CardTitle>
                      <Button size="sm" className="bg-gradient-primary text-white">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {files.map((file, index) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.size} • {file.date}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">View</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Add Note */}
            <Card className="border-2 border-secondary/20 card-hover">
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write a note about this lead..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mb-3"
                  rows={4}
                />
                <Button className="w-full bg-gradient-primary text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Save Note
                </Button>
              </CardContent>
            </Card>

            {/* Schedule Follow-up */}
            <Card className="border-2 border-accent/20 card-hover">
              <CardHeader>
                <CardTitle>Schedule Follow-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="datetime-local"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
                <Textarea
                  placeholder="Follow-up details..."
                  rows={3}
                />
                <Button className="w-full bg-gradient-secondary text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Lead
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Meeting
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeadDetails;
