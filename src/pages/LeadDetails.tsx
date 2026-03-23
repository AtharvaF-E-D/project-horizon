import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

const LeadDetails = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("other");
  const [status, setStatus] = useState("new");
  const [score, setScore] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isNew) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setCompany(data.company || "");
        setTitle(data.title || "");
        setSource(data.source || "other");
        setStatus(data.status || "new");
        setScore(data.score?.toString() || "0");
        setNotes(data.notes || "");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Error", description: "First name and last name are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        navigate("/auth");
        return;
      }

      const leadData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email || null,
        phone: phone || null,
        company: company || null,
        title: title || null,
        source: source as any,
        status: status as any,
        score: parseInt(score) || 0,
        notes: notes || null,
        user_id: user.id,
      };

      if (isNew) {
        const { error } = await supabase.from("leads").insert(leadData);
        if (error) throw error;
        toast({ title: "Success", description: "Lead created successfully" });
        navigate("/leads");
      } else {
        const { error } = await supabase
          .from("leads")
          .update(leadData)
          .eq("id", id);
        if (error) throw error;
        toast({ title: "Success", description: "Lead updated successfully" });
      }
    } catch (error: any) {
      console.error("Save lead error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Lead deleted successfully" });
      navigate("/leads");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/leads")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isNew ? "New Lead" : "Edit Lead"}
            </h1>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sales Manager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="unqualified">Unqualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="email_campaign">Email Campaign</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="score">Lead Score</Label>
                  <Input
                    id="score"
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isNew ? "Create Lead" : "Save Lead"}
                </Button>
                {!isNew && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LeadDetails;
