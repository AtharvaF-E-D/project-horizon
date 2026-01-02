import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Search, Filter, Clock, CheckCircle2, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type Profile = Tables<"profiles">;

const Tasks = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    assigned_to: "unassigned",
    related_to_type: "none",
    related_to_id: "none",
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

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", statusFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }
      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const taskData: any = { 
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date || null,
        user_id: user.id,
        priority: formData.priority as any,
        status: formData.status as any,
        assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to,
        related_to_type: formData.related_to_type === "none" ? null : formData.related_to_type,
        related_to_id: formData.related_to_id === "none" ? null : formData.related_to_id,
      };

      const { error } = await supabase.from("tasks").insert([taskData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
      setIsOpen(false);
      setFormData({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        status: "todo",
        assigned_to: "unassigned",
        related_to_type: "none",
        related_to_id: "none",
      });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "completed" ? "todo" : "completed";
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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

  const isCallTask = (task: Task) => task.related_to_type === "call";

  const handleCallNow = (task: Task) => {
    // Navigate to calls page - the task title contains the phone info
    navigate("/calls");
  };

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = searchQuery === "" || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || 
      (typeFilter === "calls" && task.related_to_type === "call") ||
      (typeFilter === "other" && task.related_to_type !== "call");
    
    return matchesSearch && matchesType;
  }) || [];

  const activeTasks = filteredTasks.filter(t => t.status !== "completed");
  const completedTasks = filteredTasks.filter(t => t.status === "completed");

  const tasksByDate = filteredTasks.reduce((acc, task) => {
    const date = task.due_date || "No date";
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const callTasks = filteredTasks.filter(t => t.related_to_type === "call" && t.status !== "completed");

  const stats = [
    { label: "Active Tasks", value: activeTasks.length, icon: Clock, color: "text-primary" },
    { label: "Completed", value: completedTasks.length, icon: CheckCircle2, color: "text-green-500" },
    { label: "High Priority", value: tasks?.filter(t => t.priority === "high" && t.status !== "completed").length || 0, icon: Calendar, color: "text-red-500" },
    { label: "Scheduled Calls", value: callTasks.length, icon: Phone, color: "text-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-16 p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Tasks & Reminders</h1>
          <p className="text-muted-foreground">Manage your tasks and stay organized</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-2 border-primary/20 card-hover animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3 mb-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="calls">
                <span className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  Call Tasks
                </span>
              </SelectItem>
              <SelectItem value="other">Other Tasks</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsOpen(true)} className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="list" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="space-y-6">
              {/* Active Tasks */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle>Active Tasks</CardTitle>
                  <CardDescription>{activeTasks.length} tasks pending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={task.status === "completed"}
                            onCheckedChange={() => {
                              toggleStatusMutation.mutate({ id: task.id, currentStatus: task.status || "todo" });
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isCallTask(task) && <Phone className="w-4 h-4 text-primary" />}
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white`}>
                              {task.priority}
                            </Badge>
                            {isCallTask(task) && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                <Phone className="w-3 h-3 mr-1" />
                                Scheduled Call
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
                            </span>
                            {task.assigned_to && <Badge variant="secondary">Assigned</Badge>}
                            {task.related_to_type && task.related_to_type !== "call" && (
                              <Badge variant="outline">{task.related_to_type}</Badge>
                            )}
                          </div>
                        </div>
                        {isCallTask(task) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCallNow(task);
                            }}
                          >
                            <Phone className="w-3 h-3" />
                            Call Now
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <Card className="border-2 border-green-500/20">
                  <CardHeader>
                    <CardTitle>Completed Tasks</CardTitle>
                    <CardDescription>{completedTasks.length} tasks completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {completedTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg opacity-60 animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <Checkbox
                            checked={task.status === "completed"}
                            onCheckedChange={() => toggleStatusMutation.mutate({ id: task.id, currentStatus: task.status || "todo" })}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium line-through">{task.title}</h4>
                              <Badge variant="outline" className="bg-green-500 text-white">
                                {task.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Tasks organized by due date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(tasksByDate).map(([date, dateTasks], dateIndex) => (
                    <div key={date} className="animate-fade-in" style={{ animationDelay: `${dateIndex * 100}ms` }}>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {date === "No date" ? date : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="space-y-2 ml-7">
                        {dateTasks.map((task, taskIndex) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                            style={{ animationDelay: `${(dateIndex * 100) + (taskIndex * 50)}ms` }}
                          >
                            <Checkbox
                              checked={task.status === "completed"}
                              onCheckedChange={() => toggleStatusMutation.mutate({ id: task.id, currentStatus: task.status || "todo" })}
                            />
                            <div className="flex-1">
                              <p className={`font-medium ${task.status === "completed" ? 'line-through opacity-60' : ''}`}>
                                {task.title}
                              </p>
                            </div>
                            <Badge variant="outline" className={`${getPriorityColor(task.priority || "medium")} text-white`}>
                              {task.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Task Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to your workflow</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="unassigned">None</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="related_type">Related To</Label>
                <Select 
                  value={formData.related_to_type} 
                  onValueChange={(value) => setFormData({ ...formData, related_to_type: value, related_to_id: "none" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.related_to_type !== "none" && (
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
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createMutation.mutate()}
                  disabled={!formData.title || createMutation.isPending}
                  className="gradient-primary text-white"
                >
                  {createMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Tasks;
