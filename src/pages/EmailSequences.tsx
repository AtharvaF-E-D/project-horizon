import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Loader2,
  Mail,
  Trash2,
  Play,
  Pause,
  Clock,
  Users,
  ChevronRight,
  Zap,
  ArrowRight,
  GripVertical,
  Edit,
  Copy,
} from "lucide-react";
import { format } from "date-fns";

interface SequenceStep {
  id?: string;
  step_order: number;
  subject: string;
  content: string;
  delay_days: number;
  delay_hours: number;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_value: string | null;
  status: string;
  created_at: string;
  steps?: SequenceStep[];
  enrollment_count?: number;
}

interface Segment {
  id: string;
  name: string;
}

const TRIGGER_TYPES = [
  { value: "manual", label: "Manual enrollment", icon: Users },
  { value: "subscription", label: "New subscription", icon: Mail },
  { value: "segment_join", label: "Joins segment", icon: Zap },
  { value: "tag_added", label: "Tag added", icon: Zap },
];

const EmailSequences = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [triggerValue, setTriggerValue] = useState("");
  const [steps, setSteps] = useState<SequenceStep[]>([
    { step_order: 1, subject: "", content: "", delay_days: 0, delay_hours: 0 },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sequencesRes, segmentsRes, subscribersRes, enrollmentsRes] =
        await Promise.all([
          supabase
            .from("email_sequences")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("segments").select("id, name"),
          supabase.from("subscribers").select("tags"),
          supabase.from("sequence_enrollments").select("sequence_id"),
        ]);

      if (sequencesRes.error) throw sequencesRes.error;

      // Get unique tags
      const tags = new Set<string>();
      (subscribersRes.data || []).forEach((sub) => {
        (sub.tags || []).forEach((tag: string) => tags.add(tag));
      });

      // Count enrollments per sequence
      const enrollmentCounts: Record<string, number> = {};
      (enrollmentsRes.data || []).forEach((e) => {
        enrollmentCounts[e.sequence_id] =
          (enrollmentCounts[e.sequence_id] || 0) + 1;
      });

      const sequencesWithCounts = (sequencesRes.data || []).map((seq) => ({
        ...seq,
        enrollment_count: enrollmentCounts[seq.id] || 0,
      }));

      setSequences(sequencesWithCounts);
      setSegments(segmentsRes.data || []);
      setAllTags(Array.from(tags));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setTriggerType("manual");
    setTriggerValue("");
    setSteps([
      { step_order: 1, subject: "", content: "", delay_days: 0, delay_hours: 0 },
    ]);
    setEditingSequence(null);
  };

  const openEditDialog = async (sequence: Sequence) => {
    try {
      // Fetch steps for this sequence
      const { data: stepsData, error } = await supabase
        .from("sequence_steps")
        .select("*")
        .eq("sequence_id", sequence.id)
        .order("step_order", { ascending: true });

      if (error) throw error;

      setEditingSequence(sequence);
      setName(sequence.name);
      setDescription(sequence.description || "");
      setTriggerType(sequence.trigger_type);
      setTriggerValue(sequence.trigger_value || "");
      setSteps(
        stepsData && stepsData.length > 0
          ? stepsData
          : [
              {
                step_order: 1,
                subject: "",
                content: "",
                delay_days: 0,
                delay_hours: 0,
              },
            ]
      );
      setDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load sequence details",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Sequence name is required",
        variant: "destructive",
      });
      return;
    }

    const validSteps = steps.filter((s) => s.subject.trim() && s.content.trim());
    if (validSteps.length === 0) {
      toast({
        title: "Error",
        description: "At least one email step is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const sequenceData = {
        name,
        description: description || null,
        trigger_type: triggerType,
        trigger_value: triggerValue || null,
        user_id: user.id,
      };

      let sequenceId: string;

      if (editingSequence) {
        const { error } = await supabase
          .from("email_sequences")
          .update(sequenceData)
          .eq("id", editingSequence.id);
        if (error) throw error;
        sequenceId = editingSequence.id;

        // Delete existing steps and re-create
        await supabase
          .from("sequence_steps")
          .delete()
          .eq("sequence_id", sequenceId);
      } else {
        const { data, error } = await supabase
          .from("email_sequences")
          .insert(sequenceData)
          .select()
          .single();
        if (error) throw error;
        sequenceId = data.id;
      }

      // Insert steps
      const stepsToInsert = validSteps.map((step, index) => ({
        sequence_id: sequenceId,
        step_order: index + 1,
        subject: step.subject,
        content: step.content,
        delay_days: step.delay_days,
        delay_hours: step.delay_hours,
      }));

      const { error: stepsError } = await supabase
        .from("sequence_steps")
        .insert(stepsToInsert);
      if (stepsError) throw stepsError;

      toast({
        title: "Success",
        description: editingSequence
          ? "Sequence updated"
          : "Sequence created",
      });
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sequence? All enrollments will be removed."))
      return;

    try {
      const { error } = await supabase
        .from("email_sequences")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Sequence deleted" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (sequence: Sequence) => {
    const newStatus = sequence.status === "active" ? "paused" : "active";
    try {
      const { error } = await supabase
        .from("email_sequences")
        .update({ status: newStatus })
        .eq("id", sequence.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: `Sequence ${newStatus === "active" ? "activated" : "paused"}`,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        step_order: steps.length + 1,
        subject: "",
        content: "",
        delay_days: 1,
        delay_hours: 0,
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (
    index: number,
    field: keyof SequenceStep,
    value: string | number
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <Play className="w-3 h-3 mr-1" /> Active
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="secondary">
            <Pause className="w-3 h-3 mr-1" /> Paused
          </Badge>
        );
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getTriggerLabel = (type: string, value: string | null) => {
    const trigger = TRIGGER_TYPES.find((t) => t.value === type);
    if (!trigger) return type;

    if (type === "segment_join" && value) {
      const segment = segments.find((s) => s.id === value);
      return `Joins: ${segment?.name || "Unknown"}`;
    }
    if (type === "tag_added" && value) {
      return `Tag: ${value}`;
    }
    return trigger.label;
  };

  const filteredSequences = sequences.filter((seq) =>
    seq.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <DashboardNav />
        <main className="ml-64 pt-20 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />

      <main className="ml-64 pt-20 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2">
                Email Sequences
              </h1>
              <p className="text-muted-foreground">
                Automate multi-step email campaigns based on subscriber behavior
              </p>
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Sequence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSequence ? "Edit Sequence" : "Create Sequence"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Sequence Name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Welcome Series"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Trigger</Label>
                      <Select value={triggerType} onValueChange={setTriggerType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              <div className="flex items-center gap-2">
                                <t.icon className="w-4 h-4" />
                                {t.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {triggerType === "segment_join" && (
                    <div className="grid gap-2">
                      <Label>Select Segment</Label>
                      <Select value={triggerValue} onValueChange={setTriggerValue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a segment..." />
                        </SelectTrigger>
                        <SelectContent>
                          {segments.map((seg) => (
                            <SelectItem key={seg.id} value={seg.id}>
                              {seg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {triggerType === "tag_added" && (
                    <div className="grid gap-2">
                      <Label>Select Tag</Label>
                      <Select value={triggerValue} onValueChange={setTriggerValue}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a tag..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allTags.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this sequence..."
                      rows={2}
                    />
                  </div>

                  {/* Email Steps */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Email Steps</Label>
                      <Badge variant="secondary">
                        {steps.length} email{steps.length !== 1 && "s"}
                      </Badge>
                    </div>

                    {steps.map((step, index) => (
                      <Card key={index} className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                              {index + 1}
                            </div>
                            <div className="text-sm font-medium">
                              Email {index + 1}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {index > 0 && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                Wait
                                <Input
                                  type="number"
                                  min="0"
                                  value={step.delay_days}
                                  onChange={(e) =>
                                    updateStep(
                                      index,
                                      "delay_days",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 h-8"
                                />
                                days
                                <Input
                                  type="number"
                                  min="0"
                                  max="23"
                                  value={step.delay_hours}
                                  onChange={(e) =>
                                    updateStep(
                                      index,
                                      "delay_hours",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 h-8"
                                />
                                hours
                              </div>
                            )}
                            {steps.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStep(index)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-sm">Subject Line</Label>
                          <Input
                            value={step.subject}
                            onChange={(e) =>
                              updateStep(index, "subject", e.target.value)
                            }
                            placeholder="Email subject..."
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label className="text-sm">Email Content</Label>
                          <Textarea
                            value={step.content}
                            onChange={(e) =>
                              updateStep(index, "content", e.target.value)
                            }
                            placeholder="Write your email content..."
                            rows={4}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Use {"{{first_name}}"}, {"{{last_name}}"},{" "}
                            {"{{email}}"} for personalization
                          </p>
                        </div>
                      </Card>
                    ))}

                    <Button
                      variant="outline"
                      onClick={addStep}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Email Step
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1">
                      {editingSequence ? "Update Sequence" : "Create Sequence"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{sequences.length}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Sequences
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Play className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {sequences.filter((s) => s.status === "active").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {sequences.reduce(
                      (sum, s) => sum + (s.enrollment_count || 0),
                      0
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Enrollments
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {
                      sequences.filter((s) => s.trigger_type !== "manual")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Automated
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sequences..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Card>

          {/* Sequences Grid */}
          {filteredSequences.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">No sequences yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automated email sequence
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Sequence
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredSequences.map((sequence) => (
                <Card
                  key={sequence.id}
                  className="p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{sequence.name}</h3>
                        {getStatusBadge(sequence.status)}
                      </div>
                      {sequence.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {sequence.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleStatus(sequence)}
                        title={
                          sequence.status === "active" ? "Pause" : "Activate"
                        }
                      >
                        {sequence.status === "active" ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(sequence)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sequence.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {getTriggerLabel(
                        sequence.trigger_type,
                        sequence.trigger_value
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {sequence.enrollment_count || 0} enrolled
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created {format(new Date(sequence.created_at), "MMM d, yyyy")}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmailSequences;
