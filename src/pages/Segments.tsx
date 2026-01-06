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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Loader2,
  Users,
  Trash2,
  Filter,
  Tag,
  Calendar,
  Mail,
  X,
  Edit,
} from "lucide-react";
import { format } from "date-fns";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  conditions: Condition[];
  match_type: string;
  subscriber_count: number;
  created_at: string;
  updated_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  tags: string[];
  subscribed_at: string;
}

const FIELD_OPTIONS = [
  { value: "tags", label: "Tags", type: "array" },
  { value: "status", label: "Status", type: "select" },
  { value: "subscribed_at", label: "Subscribed Date", type: "date" },
  { value: "email", label: "Email", type: "text" },
  { value: "first_name", label: "First Name", type: "text" },
  { value: "last_name", label: "Last Name", type: "text" },
];

const OPERATORS = {
  text: [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
  ],
  array: [
    { value: "includes", label: "Includes" },
    { value: "excludes", label: "Excludes" },
  ],
  select: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
  ],
  date: [
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "within_days", label: "Within last X days" },
  ],
};

const Segments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [matchType, setMatchType] = useState("all");
  const [conditions, setConditions] = useState<Condition[]>([
    { field: "tags", operator: "includes", value: "" },
  ]);

  // All unique tags from subscribers
  const allTags = [...new Set(subscribers.flatMap((s) => s.tags || []))];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [segmentsRes, subscribersRes] = await Promise.all([
        supabase
          .from("segments")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("subscribers").select("*"),
      ]);

      if (segmentsRes.error) throw segmentsRes.error;
      if (subscribersRes.error) throw subscribersRes.error;

      // Parse conditions from JSON
      const parsedSegments = (segmentsRes.data || []).map((seg) => ({
        ...seg,
        conditions: (Array.isArray(seg.conditions) ? seg.conditions : []) as unknown as Condition[],
      })) as Segment[];

      setSubscribers(subscribersRes.data || []);

      // Calculate subscriber counts for each segment
      const updatedSegments = parsedSegments.map((seg) => ({
        ...seg,
        subscriber_count: countMatchingSubscribers(
          subscribersRes.data || [],
          seg.conditions,
          seg.match_type
        ),
      }));
      setSegments(updatedSegments);
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

  const countMatchingSubscribers = (
    subs: Subscriber[],
    conds: Condition[],
    match: string
  ): number => {
    if (!conds || conds.length === 0) return subs.length;

    return subs.filter((sub) => {
      const results = conds.map((cond) => evaluateCondition(sub, cond));
      return match === "all" ? results.every(Boolean) : results.some(Boolean);
    }).length;
  };

  const evaluateCondition = (sub: Subscriber, cond: Condition): boolean => {
    const value = (sub as any)[cond.field];

    switch (cond.operator) {
      case "includes":
        return Array.isArray(value) && value.includes(cond.value);
      case "excludes":
        return Array.isArray(value) && !value.includes(cond.value);
      case "equals":
        return String(value).toLowerCase() === cond.value.toLowerCase();
      case "not_equals":
        return String(value).toLowerCase() !== cond.value.toLowerCase();
      case "contains":
        return String(value).toLowerCase().includes(cond.value.toLowerCase());
      case "starts_with":
        return String(value).toLowerCase().startsWith(cond.value.toLowerCase());
      case "ends_with":
        return String(value).toLowerCase().endsWith(cond.value.toLowerCase());
      case "before":
        return new Date(value) < new Date(cond.value);
      case "after":
        return new Date(value) > new Date(cond.value);
      case "within_days":
        const days = parseInt(cond.value) || 0;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return new Date(value) >= cutoff;
      default:
        return false;
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setMatchType("all");
    setConditions([{ field: "tags", operator: "includes", value: "" }]);
    setEditingSegment(null);
  };

  const openEditDialog = (segment: Segment) => {
    setEditingSegment(segment);
    setName(segment.name);
    setDescription(segment.description || "");
    setMatchType(segment.match_type);
    setConditions(
      segment.conditions.length > 0
        ? segment.conditions
        : [{ field: "tags", operator: "includes", value: "" }]
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Segment name is required",
        variant: "destructive",
      });
      return;
    }

    const validConditions = conditions.filter((c) => c.value.trim() !== "");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const segmentData = {
        name,
        description: description || null,
        conditions: JSON.parse(JSON.stringify(validConditions)),
        match_type: matchType,
        subscriber_count: countMatchingSubscribers(
          subscribers,
          validConditions,
          matchType
        ),
        user_id: user.id,
      };

      if (editingSegment) {
        const { error } = await supabase
          .from("segments")
          .update(segmentData)
          .eq("id", editingSegment.id);
        if (error) throw error;
        toast({ title: "Success", description: "Segment updated" });
      } else {
        const { error } = await supabase.from("segments").insert(segmentData);
        if (error) throw error;
        toast({ title: "Success", description: "Segment created" });
      }

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
    if (!confirm("Delete this segment?")) return;

    try {
      const { error } = await supabase.from("segments").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Segment deleted" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: "tags", operator: "includes", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (
    index: number,
    field: keyof Condition,
    value: string
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };

    // Reset operator when field changes
    if (field === "field") {
      const fieldType =
        FIELD_OPTIONS.find((f) => f.value === value)?.type || "text";
      updated[index].operator =
        OPERATORS[fieldType as keyof typeof OPERATORS][0].value;
      updated[index].value = "";
    }

    setConditions(updated);
  };

  const getFieldType = (fieldValue: string) => {
    return FIELD_OPTIONS.find((f) => f.value === fieldValue)?.type || "text";
  };

  const filteredSegments = segments.filter((seg) =>
    seg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Live preview count
  const previewCount = countMatchingSubscribers(
    subscribers,
    conditions.filter((c) => c.value.trim() !== ""),
    matchType
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
              <h1 className="font-heading text-3xl font-bold mb-2">Segments</h1>
              <p className="text-muted-foreground">
                Group subscribers based on behavior and attributes
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Segment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSegment ? "Edit Segment" : "Create Segment"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label>Segment Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Engaged Users"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this segment..."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Match Type</Label>
                    <Select value={matchType} onValueChange={setMatchType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Match ALL conditions (AND)
                        </SelectItem>
                        <SelectItem value="any">
                          Match ANY condition (OR)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Conditions</Label>
                    {conditions.map((cond, index) => {
                      const fieldType = getFieldType(cond.field);
                      const operators =
                        OPERATORS[fieldType as keyof typeof OPERATORS];

                      return (
                        <Card key={index} className="p-3">
                          <div className="flex items-center gap-2">
                            <Select
                              value={cond.field}
                              onValueChange={(v) =>
                                updateCondition(index, "field", v)
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={cond.operator}
                              onValueChange={(v) =>
                                updateCondition(index, "operator", v)
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {operators.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {cond.field === "tags" ? (
                              <Select
                                value={cond.value}
                                onValueChange={(v) =>
                                  updateCondition(index, "value", v)
                                }
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select tag" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allTags.map((tag) => (
                                    <SelectItem key={tag} value={tag}>
                                      {tag}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : cond.field === "status" ? (
                              <Select
                                value={cond.value}
                                onValueChange={(v) =>
                                  updateCondition(index, "value", v)
                                }
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="unsubscribed">
                                    Unsubscribed
                                  </SelectItem>
                                  <SelectItem value="bounced">
                                    Bounced
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : fieldType === "date" &&
                              cond.operator !== "within_days" ? (
                              <Input
                                type="date"
                                value={cond.value}
                                onChange={(e) =>
                                  updateCondition(index, "value", e.target.value)
                                }
                                className="flex-1"
                              />
                            ) : (
                              <Input
                                value={cond.value}
                                onChange={(e) =>
                                  updateCondition(index, "value", e.target.value)
                                }
                                placeholder={
                                  cond.operator === "within_days"
                                    ? "Number of days"
                                    : "Value..."
                                }
                                className="flex-1"
                              />
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCondition(index)}
                              disabled={conditions.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCondition}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Condition
                    </Button>
                  </div>

                  {/* Live preview */}
                  <Card className="p-4 bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">
                          {previewCount} subscribers match
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Based on current conditions
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1">
                      {editingSegment ? "Update Segment" : "Create Segment"}
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
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Filter className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{segments.length}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Segments
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {subscribers.filter((s) => s.status === "active").length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Active Subscribers
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Tag className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{allTags.length}</div>
                  <div className="text-sm text-muted-foreground">
                    Unique Tags
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
                placeholder="Search segments..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Card>

          {/* Segments Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSegments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No segments found. Create your first segment!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSegments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{segment.name}</div>
                          {segment.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {segment.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {segment.conditions.slice(0, 2).map((cond, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {cond.field} {cond.operator} {cond.value}
                            </Badge>
                          ))}
                          {segment.conditions.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{segment.conditions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          {segment.subscriber_count}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(segment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(segment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(segment.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Segments;
