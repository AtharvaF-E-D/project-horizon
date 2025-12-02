import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    status: "todo",
    assigned_to: "",
    related_to_type: "",
    related_to_id: "",
  });

  useEffect(() => {
    fetchTeamMembers();
    fetchRelatedEntities();
  }, []);

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error && data) setTeamMembers(data);
  };

  const fetchRelatedEntities = async () => {
    const [leadsRes, contactsRes, dealsRes, companiesRes] = await Promise.all([
      supabase.from("leads").select("id, first_name, last_name"),
      supabase.from("contacts").select("id, first_name, last_name"),
      supabase.from("deals").select("id, title"),
      supabase.from("companies").select("id, name"),
    ]);
    if (leadsRes.data) setLeads(leadsRes.data);
    if (contactsRes.data) setContacts(contactsRes.data);
    if (dealsRes.data) setDeals(dealsRes.data);
    if (companiesRes.data) setCompanies(companiesRes.data);
  };

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title || "",
          description: data.description || "",
          due_date: data.due_date ? new Date(data.due_date).toISOString().slice(0, 16) : "",
          priority: data.priority || "medium",
          status: data.status || "todo",
          assigned_to: data.assigned_to || "",
          related_to_type: data.related_to_type || "",
          related_to_id: data.related_to_id || "",
        });
      }
      return data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const taskData: any = {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date || null,
        priority: formData.priority as any,
        status: formData.status as any,
        assigned_to: formData.assigned_to || null,
        related_to_type: formData.related_to_type || null,
        related_to_id: formData.related_to_id || null,
      };

      const { error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
      navigate("/tasks");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-accent";
      case "low":
        return "bg-primary";
      default:
        return "bg-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary";
      case "in_progress":
        return "bg-accent";
      case "todo":
        return "bg-secondary";
      default:
        return "bg-muted";
    }
  };

  const getRelatedEntities = () => {
    switch (formData.related_to_type) {
      case "lead":
        return leads.map(l => ({ id: l.id, name: `${l.first_name} ${l.last_name}` }));
      case "contact":
        return contacts.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` }));
      case "deal":
        return deals.map(d => ({ id: d.id, name: d.title }));
      case "company":
        return companies.map(c => ({ id: c.id, name: c.name }));
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <DashboardNavbar />
        <DashboardNav />
        <main className="ml-64 pt-16 p-8">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <DashboardNavbar />
        <DashboardNav />
        <main className="ml-64 pt-16 p-8">
          <p>Task not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-16 p-8">
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/tasks")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">Task Details</h1>
              <div className="flex items-center gap-2">
                <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                  {task.priority}
                </Badge>
                <Badge className={`${getStatusColor(task.status || "todo")} text-white`}>
                  {task.status?.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this task?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={!formData.title || updateMutation.isPending}
              className="gradient-primary text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-primary/20 animate-fade-in">
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Task title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-primary/20 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle>Related To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="related_type">Type</Label>
                  <Select 
                    value={formData.related_to_type} 
                    onValueChange={(value) => setFormData({ ...formData, related_to_type: value, related_to_id: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="contact">Contact</SelectItem>
                      <SelectItem value="deal">Deal</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.related_to_type && (
                  <div className="space-y-2">
                    <Label htmlFor="related_id">Select {formData.related_to_type}</Label>
                    <Select value={formData.related_to_id} onValueChange={(value) => setFormData({ ...formData, related_to_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${formData.related_to_type}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getRelatedEntities().map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskDetails;
