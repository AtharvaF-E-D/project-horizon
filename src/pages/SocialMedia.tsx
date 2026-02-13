import { useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Plus, Send, Image, Video, Link2, BarChart3, Heart, MessageCircle, Share2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduledPost {
  id: string;
  content: string;
  platform: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "failed";
  engagement?: { likes: number; comments: number; shares: number; views: number };
}

const mockPosts: ScheduledPost[] = [
  { id: "1", content: "🚀 Excited to announce our new CRM features! Streamline your sales process with AI-powered insights. #CRM #SalesTech", platform: "LinkedIn", scheduledAt: "2026-02-14T10:00:00", status: "scheduled" },
  { id: "2", content: "Tips for closing more deals in 2026: 1. Follow up within 24h 2. Personalize your approach 3. Use data-driven insights", platform: "Twitter", scheduledAt: "2026-02-13T14:00:00", status: "published", engagement: { likes: 45, comments: 12, shares: 8, views: 1200 } },
  { id: "3", content: "Behind the scenes at SIMPLIFY HQ! Our team is working hard to bring you the best CRM experience. 💪", platform: "Instagram", scheduledAt: "2026-02-15T09:00:00", status: "scheduled" },
  { id: "4", content: "Case study: How TechCorp increased conversions by 40% using SIMPLIFY CRM. Read more on our blog!", platform: "Facebook", scheduledAt: "2026-02-12T11:00:00", status: "published", engagement: { likes: 89, comments: 23, shares: 15, views: 3400 } },
  { id: "5", content: "Join our webinar: Master Sales Pipeline Management. Register now! 📅", platform: "LinkedIn", scheduledAt: "2026-02-16T15:00:00", status: "scheduled" },
];

const platformColors: Record<string, string> = {
  LinkedIn: "bg-blue-600/10 text-blue-600",
  Twitter: "bg-sky-500/10 text-sky-500",
  Instagram: "bg-pink-500/10 text-pink-500",
  Facebook: "bg-indigo-500/10 text-indigo-500",
};

export default function SocialMedia() {
  const { toast } = useToast();
  const [newPost, setNewPost] = useState("");

  const publishedPosts = mockPosts.filter(p => p.status === "published");
  const totalEngagement = publishedPosts.reduce((s, p) => s + (p.engagement?.likes || 0) + (p.engagement?.comments || 0) + (p.engagement?.shares || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Social Media Scheduler</h1>
              <p className="text-muted-foreground mt-2">Plan, schedule, and analyze your social media content</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Scheduled</p><p className="text-2xl font-bold">{mockPosts.filter(p => p.status === "scheduled").length}</p></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-3"><Send className="h-5 w-5 text-green-500" /><div><p className="text-xs text-muted-foreground">Published</p><p className="text-2xl font-bold">{publishedPosts.length}</p></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-3"><Heart className="h-5 w-5 text-red-500" /><div><p className="text-xs text-muted-foreground">Total Engagement</p><p className="text-2xl font-bold">{totalEngagement}</p></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-3"><Eye className="h-5 w-5 text-secondary" /><div><p className="text-xs text-muted-foreground">Total Reach</p><p className="text-2xl font-bold">{publishedPosts.reduce((s, p) => s + (p.engagement?.views || 0), 0).toLocaleString()}</p></div></div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="What's on your mind? Write your post here..." value={newPost} onChange={e => setNewPost(e.target.value)} rows={4} />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Image className="w-4 h-4 mr-1" /> Photo</Button>
                  <Button variant="outline" size="sm"><Video className="w-4 h-4 mr-1" /> Video</Button>
                  <Button variant="outline" size="sm"><Link2 className="w-4 h-4 mr-1" /> Link</Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toast({ title: "Coming soon", description: "Scheduling will be available shortly." })}><Clock className="w-4 h-4 mr-1" /> Schedule</Button>
                  <Button className="gradient-primary text-primary-foreground" onClick={() => toast({ title: "Coming soon", description: "Publishing will be available shortly." })}><Send className="w-4 h-4 mr-1" /> Post Now</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="scheduled">
            <TabsList>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="space-y-4 mt-4">
              {mockPosts.filter(p => p.status === "scheduled").map(post => (
                <Card key={post.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={platformColors[post.platform]}>{post.platform}</Badge>
                          <span className="text-xs text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />{new Date(post.scheduledAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm">{post.content}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive">Cancel</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="published" className="space-y-4 mt-4">
              {publishedPosts.map(post => (
                <Card key={post.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={platformColors[post.platform]}>{post.platform}</Badge>
                          <Badge className="bg-green-500/10 text-green-600">Published</Badge>
                        </div>
                        <p className="text-sm mb-3">{post.content}</p>
                        {post.engagement && (
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span><Heart className="w-3 h-3 inline mr-1" />{post.engagement.likes}</span>
                            <span><MessageCircle className="w-3 h-3 inline mr-1" />{post.engagement.comments}</span>
                            <span><Share2 className="w-3 h-3 inline mr-1" />{post.engagement.shares}</span>
                            <span><Eye className="w-3 h-3 inline mr-1" />{post.engagement.views.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}