import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Trash2, Mail, Phone, User } from "lucide-react";

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (id && id !== "new") {
      fetchCompany();
    }
  }, [id]);

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name);
        setWebsite(data.website || "");
        setIndustry(data.industry || "");
        setSize(data.size || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setNotes(data.notes || "");
      }

      // Fetch related contacts
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", id);
      
      setContacts(contactsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load company details",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const companyData = {
        name,
        website: website || null,
        industry: industry || null,
        size: size || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      };

      if (id === "new") {
        const { error } = await supabase.from("companies").insert(companyData);
        if (error) throw error;
        toast({ title: "Success", description: "Company created successfully" });
        navigate("/companies");
      } else {
        const { error } = await supabase
          .from("companies")
          .update(companyData)
          .eq("id", id);
        if (error) throw error;
        toast({ title: "Success", description: "Company updated successfully" });
      }
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this company?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Company deleted successfully" });
      navigate("/companies");
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
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8 ml-64">
          <div className="max-w-2xl">
            <Button
              variant="ghost"
              onClick={() => navigate("/companies")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {id === "new" ? "New Company" : "Edit Company"}
              </h1>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Technology"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="size">Company Size</Label>
                    <Input
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="1-50 employees"
                    />
                  </div>
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

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this company..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Company"}
                  </Button>
                  {id !== "new" && (
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

            {id !== "new" && contacts.length > 0 && (
              <Card className="p-6 mt-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Related Contacts ({contacts.length})</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <Card
                        key={contact.id}
                        className="p-4 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {contact.first_name[0]}
                              {contact.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </p>
                            {contact.title && (
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.title}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 text-muted-foreground">
                            {contact.email && <Mail className="h-4 w-4" />}
                            {contact.phone && <Phone className="h-4 w-4" />}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyDetails;
