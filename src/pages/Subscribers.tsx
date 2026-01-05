import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Search, Mail, UserCheck, UserX, Loader2, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  tags: string[];
  subscribed_at: string;
  unsubscribed_at: string | null;
}

const Subscribers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  
  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formTags, setFormTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching subscribers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubscriber = async () => {
    if (!formEmail) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const subscriberData = {
        email: formEmail,
        first_name: formFirstName || null,
        last_name: formLastName || null,
        tags: formTags ? formTags.split(",").map(t => t.trim()) : [],
        user_id: user.id,
      };

      if (editingSubscriber) {
        const { error } = await supabase
          .from("subscribers")
          .update(subscriberData)
          .eq("id", editingSubscriber.id);
        if (error) throw error;
        toast({ title: "Subscriber updated successfully" });
      } else {
        const { error } = await supabase
          .from("subscribers")
          .insert(subscriberData);
        if (error) throw error;
        toast({ title: "Subscriber added successfully" });
      }

      resetForm();
      fetchSubscribers();
    } catch (error: any) {
      toast({
        title: "Error saving subscriber",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    
    try {
      const { error } = await supabase.from("subscribers").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Subscriber deleted" });
      fetchSubscribers();
    } catch (error: any) {
      toast({
        title: "Error deleting subscriber",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (subscriber: Subscriber) => {
    const newStatus = subscriber.status === "active" ? "unsubscribed" : "active";
    try {
      const { error } = await supabase
        .from("subscribers")
        .update({ 
          status: newStatus,
          unsubscribed_at: newStatus === "unsubscribed" ? new Date().toISOString() : null
        })
        .eq("id", subscriber.id);
      if (error) throw error;
      toast({ title: `Subscriber ${newStatus === "active" ? "reactivated" : "unsubscribed"}` });
      fetchSubscribers();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormEmail("");
    setFormFirstName("");
    setFormLastName("");
    setFormTags("");
    setEditingSubscriber(null);
    setIsAddDialogOpen(false);
  };

  const openEditDialog = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber);
    setFormEmail(subscriber.email);
    setFormFirstName(subscriber.first_name || "");
    setFormLastName(subscriber.last_name || "");
    setFormTags(subscriber.tags?.join(", ") || "");
    setIsAddDialogOpen(true);
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch = 
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.last_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === "active").length,
    unsubscribed: subscribers.filter(s => s.status === "unsubscribed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="md:pl-64 pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Subscribers</h1>
              <p className="text-muted-foreground">Manage your email subscribers</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Subscriber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSubscriber ? "Edit Subscriber" : "Add New Subscriber"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="subscriber@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formFirstName}
                        onChange={(e) => setFormFirstName(e.target.value)}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formLastName}
                        onChange={(e) => setFormLastName(e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="newsletter, vip, customer"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button onClick={handleSaveSubscriber} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {editingSubscriber ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Subscribers</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-500/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-red-500/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <UserX className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.unsubscribed}</p>
                  <p className="text-sm text-muted-foreground">Unsubscribed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subscribers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No subscribers found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>
                          {subscriber.first_name || subscriber.last_name
                            ? `${subscriber.first_name || ""} ${subscriber.last_name || ""}`.trim()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={subscriber.status === "active" ? "default" : "secondary"}>
                            {subscriber.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {subscriber.tags?.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {subscriber.tags?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{subscriber.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(subscriber.subscribed_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(subscriber)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(subscriber)}
                            >
                              {subscriber.status === "active" ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubscriber(subscriber.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Subscribers;
