import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Search, Loader2, Trash2, Edit, Copy, Star } from "lucide-react";
import { format } from "date-fns";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string | null;
  is_default: boolean | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["general", "welcome", "promotional", "transactional", "newsletter", "follow-up"];

const EmailTemplates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching templates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formName || !formSubject || !formContent) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const templateData = {
        name: formName,
        subject: formSubject,
        content: formContent,
        category: formCategory,
        user_id: user.id,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("email_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);
        if (error) throw error;
        toast({ title: "Template updated successfully" });
      } else {
        const { error } = await supabase
          .from("email_templates")
          .insert(templateData);
        if (error) throw error;
        toast({ title: "Template created successfully" });
      }

      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Template deleted" });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("email_templates").insert({
        name: `${template.name} (Copy)`,
        subject: template.subject,
        content: template.content,
        category: template.category,
        user_id: user.id,
      });
      if (error) throw error;
      toast({ title: "Template duplicated" });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error duplicating template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (template: EmailTemplate) => {
    try {
      // Remove default from all templates in same category
      await supabase
        .from("email_templates")
        .update({ is_default: false })
        .eq("category", template.category);
      
      // Set this one as default
      const { error } = await supabase
        .from("email_templates")
        .update({ is_default: true })
        .eq("id", template.id);
      if (error) throw error;
      toast({ title: "Default template set" });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error setting default",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormSubject("");
    setFormContent("");
    setFormCategory("general");
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormContent(template.content);
    setFormCategory(template.category || "general");
    setIsDialogOpen(true);
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
              <h1 className="text-3xl font-bold">Email Templates</h1>
              <p className="text-muted-foreground">Create and manage reusable email templates</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Template Name *</Label>
                      <Input
                        id="name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Welcome Email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formCategory} onValueChange={setFormCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject Line *</Label>
                    <Input
                      id="subject"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="Welcome to our platform!"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Email Content *</Label>
                    <Textarea
                      id="content"
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Hi {{first_name}},&#10;&#10;Welcome to our platform!..."
                      rows={10}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {"{{first_name}}"}, {"{{last_name}}"}, {"{{email}}"} for personalization
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button onClick={handleSaveTemplate} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {editingTemplate ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates found</p>
                <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                  Create your first template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {template.name}
                          {template.is_default && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {template.subject}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {template.content}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Updated {format(new Date(template.updated_at), "MMM d, yyyy")}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDuplicateTemplate(template)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(template)}>
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmailTemplates;
