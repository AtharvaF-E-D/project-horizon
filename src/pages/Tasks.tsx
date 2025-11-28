import { useState } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Tasks = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    status: "todo",
  });

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

      const { error } = await supabase
        .from("tasks")
        .insert([{ 
          ...formData, 
          user_id: user.id,
          priority: formData.priority as any,
          status: formData.status as any
        }]);
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
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Group tasks by date for calendar view
  const tasksByDate = tasks.reduce((acc, task) => {
    const date = task.dueDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const stats = [
    { label: "Active Tasks", value: activeTasks.length, icon: Clock, color: "text-primary" },
    { label: "Completed", value: completedTasks.length, icon: CheckCircle2, color: "text-green-500" },
    { label: "High Priority", value: tasks.filter(t => t.priority === "high" && !t.completed).length, icon: CalendarIcon, color: "text-red-500" },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-gradient-primary text-white">
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
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white`}>
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                            <Badge variant="secondary">{task.category}</Badge>
                            {task.assignedTo && <span>Assigned to: {task.assignedTo}</span>}
                          </div>
                        </div>
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
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task.id)}
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
                                <CalendarIcon className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                              <Badge variant="secondary">{task.category}</Badge>
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
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="space-y-2 ml-7">
                        {dateTasks.map((task, taskIndex) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                            style={{ animationDelay: `${(dateIndex * 100) + (taskIndex * 50)}ms` }}
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTaskCompletion(task.id)}
                            />
                            <div className="flex-1">
                              <p className={`font-medium ${task.completed ? 'line-through opacity-60' : ''}`}>
                                {task.title}
                              </p>
                            </div>
                            <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-white`}>
                              {task.priority}
                            </Badge>
                            <Badge variant="secondary">{task.category}</Badge>
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
      </main>
    </div>
  );
};

export default Tasks;
