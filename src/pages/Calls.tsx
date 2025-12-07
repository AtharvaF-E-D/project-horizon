import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneCall, PhoneIncoming, PhoneMissed, Clock, Search, User, Building2, Sparkles, Delete, Calendar, Bell, Plus, CalendarClock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format, isToday, isTomorrow, isPast, isWithinInterval, addHours } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Call {
  id: string;
  phone_number: string;
  contact_name: string | null;
  company_name: string | null;
  call_type: "incoming" | "outgoing";
  status: "completed" | "missed" | "no_answer" | "busy" | "voicemail";
  duration_seconds: number;
  notes: string | null;
  ai_summary: string | null;
  created_at: string;
  contact_id: string | null;
  scheduled_at: string | null;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  company_id: string | null;
  companies?: { name: string } | null;
}

export default function Calls() {
  const [dialNumber, setDialNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [calls, setCalls] = useState<Call[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [callStatus, setCallStatus] = useState<string>("completed");
  const [callDuration, setCallDuration] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [activeTab, setActiveTab] = useState("history");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCalls();
      fetchContacts();
    }
  }, [user]);

  const fetchCalls = async () => {
    try {
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCalls((data as Call[]) || []);
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          id,
          first_name,
          last_name,
          phone,
          company_id,
          companies:company_id (name)
        `)
        .not("phone", "is", null);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const parseDuration = (duration: string): number => {
    const parts = duration.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parseInt(duration) || 0;
  };

  const getCallIcon = (type: string, status: string) => {
    if (status === "missed" || status === "no_answer") return <PhoneMissed className="w-4 h-4 text-destructive" />;
    if (type === "incoming") return <PhoneIncoming className="w-4 h-4 text-green-500" />;
    return <Phone className="w-4 h-4 text-primary" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "missed": 
      case "no_answer": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "voicemail": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "busy": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const handleDialClick = (digit: string) => {
    setDialNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setDialNumber(prev => prev.slice(0, -1));
  };

  const handleCall = (contact?: Contact) => {
    const number = contact?.phone || dialNumber;
    if (!number) return;

    setSelectedContact(contact || null);
    if (contact?.phone) {
      setDialNumber(contact.phone);
    }
    setShowCallDialog(true);
  };

  const logCall = async () => {
    if (!user || !dialNumber) return;

    try {
      const { error } = await supabase.from("calls").insert({
        user_id: user.id,
        phone_number: dialNumber,
        contact_id: selectedContact?.id || null,
        contact_name: selectedContact 
          ? `${selectedContact.first_name} ${selectedContact.last_name}` 
          : null,
        company_name: selectedContact?.companies?.name || null,
        call_type: "outgoing" as const,
        status: callStatus as Call["status"],
        duration_seconds: parseDuration(callDuration),
        notes: callNotes || null,
      });

      if (error) throw error;

      toast({
        title: "Call logged",
        description: "Your call has been recorded successfully.",
      });

      // Reset and refresh
      setShowCallDialog(false);
      setDialNumber("");
      setCallNotes("");
      setCallDuration("");
      setCallStatus("completed");
      setSelectedContact(null);
      fetchCalls();
    } catch (error) {
      console.error("Error logging call:", error);
      toast({
        title: "Error",
        description: "Failed to log call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scheduleCall = async () => {
    if (!user || !dialNumber || !scheduleDate || !scheduleTime) return;

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      
      const { error } = await supabase.from("calls").insert({
        user_id: user.id,
        phone_number: dialNumber,
        contact_id: selectedContact?.id || null,
        contact_name: selectedContact 
          ? `${selectedContact.first_name} ${selectedContact.last_name}` 
          : null,
        company_name: selectedContact?.companies?.name || null,
        call_type: "outgoing" as const,
        status: "completed" as const,
        duration_seconds: 0,
        notes: scheduleNotes || null,
        scheduled_at: scheduledAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Call scheduled",
        description: `Reminder set for ${format(scheduledAt, "MMM d, yyyy 'at' h:mm a")}`,
      });

      // Reset and refresh
      setShowScheduleDialog(false);
      setDialNumber("");
      setScheduleDate("");
      setScheduleTime("");
      setScheduleNotes("");
      setSelectedContact(null);
      fetchCalls();
    } catch (error) {
      console.error("Error scheduling call:", error);
      toast({
        title: "Error",
        description: "Failed to schedule call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenSchedule = (contact?: Contact) => {
    if (contact) {
      setSelectedContact(contact);
      setDialNumber(contact.phone || "");
    }
    setShowScheduleDialog(true);
  };

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const phone = contact.phone?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || phone.includes(query);
  });

  const filteredCalls = calls.filter(call => {
    const name = call.contact_name?.toLowerCase() || "";
    const phone = call.phone_number.toLowerCase();
    const company = call.company_name?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query) || company.includes(query);
  });

  // Separate scheduled and completed calls
  const scheduledCalls = filteredCalls.filter(c => c.scheduled_at && !isPast(new Date(c.scheduled_at)));
  const upcomingToday = scheduledCalls.filter(c => c.scheduled_at && isToday(new Date(c.scheduled_at)));
  const upcomingTomorrow = scheduledCalls.filter(c => c.scheduled_at && isTomorrow(new Date(c.scheduled_at)));
  const upcomingSoon = scheduledCalls.filter(c => 
    c.scheduled_at && isWithinInterval(new Date(c.scheduled_at), { start: new Date(), end: addHours(new Date(), 2) })
  );
  const callHistory = filteredCalls.filter(c => !c.scheduled_at || isPast(new Date(c.scheduled_at)));

  // Calculate stats
  const totalCalls = calls.filter(c => !c.scheduled_at).length;
  const completedCalls = calls.filter(c => c.status === "completed" && !c.scheduled_at);
  const avgDuration = completedCalls.length > 0
    ? Math.round(completedCalls.reduce((acc, c) => acc + c.duration_seconds, 0) / completedCalls.length)
    : 0;
  const successRate = totalCalls > 0 
    ? ((completedCalls.length / totalCalls) * 100).toFixed(1)
    : "0";
  const missedCalls = calls.filter(c => (c.status === "missed" || c.status === "no_answer") && !c.scheduled_at).length;

  const getScheduleLabel = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
    return format(date, "MMM d 'at' h:mm a");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Call Dialer
            </h1>
            <p className="text-muted-foreground mt-2">
              Make calls, log conversations, and track your communication history
            </p>
          </div>

          {/* Upcoming Reminders Alert */}
          {upcomingSoon.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Bell className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">Upcoming Call Reminder</p>
                    <p className="text-sm text-muted-foreground">
                      You have {upcomingSoon.length} call{upcomingSoon.length > 1 ? "s" : ""} scheduled in the next 2 hours
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("scheduled")}>
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <PhoneCall className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCalls}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <CalendarClock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledCalls.length}</div>
                <p className="text-xs text-muted-foreground">upcoming</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
                <p className="text-xs text-muted-foreground">per call</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <PhoneIncoming className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{successRate}%</div>
                <p className="text-xs text-muted-foreground">completed calls</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missed Calls</CardTitle>
                <PhoneMissed className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missedCalls}</div>
                <p className="text-xs text-muted-foreground">unanswered</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dial Pad & Quick Contacts */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dial Pad</CardTitle>
                  <CardDescription>Enter number or select a contact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      value={dialNumber}
                      onChange={(e) => setDialNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="text-2xl text-center h-14 pr-10"
                    />
                    {dialNumber && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={handleBackspace}
                      >
                        <Delete className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
                      <Button
                        key={digit}
                        variant="outline"
                        size="lg"
                        onClick={() => handleDialClick(digit)}
                        className="h-14 text-xl font-semibold hover-scale"
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDialNumber("")}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => handleCall()}
                      disabled={!dialNumber}
                      className="flex-1 gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenSchedule()}
                    disabled={!dialNumber}
                    className="w-full gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Call
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Quick Dial
                  </CardTitle>
                  <CardDescription>Click to call or schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {contacts.slice(0, 10).map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleCall(contact)}>
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {contact.first_name} {contact.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{contact.phone}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleCall(contact)}>
                              <Phone className="w-4 h-4 text-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenSchedule(contact)}>
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {contacts.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No contacts with phone numbers
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Call History & Scheduled */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="history" className="gap-2">
                        <PhoneCall className="w-4 h-4" />
                        History
                      </TabsTrigger>
                      <TabsTrigger value="scheduled" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Scheduled
                        {scheduledCalls.length > 0 && (
                          <Badge variant="secondary" className="ml-1">{scheduledCalls.length}</Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search calls..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === "history" && (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading calls...</div>
                      ) : callHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No calls recorded yet. Make your first call!
                        </div>
                      ) : (
                        callHistory.map((call) => (
                        <Card key={call.id} className="hover-scale">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="mt-1">
                                  {getCallIcon(call.call_type, call.status)}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold">
                                      {call.contact_name || call.phone_number}
                                    </p>
                                    <Badge className={getStatusColor(call.status)}>
                                      {call.status.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  {call.company_name && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {call.company_name}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(call.duration_seconds)}
                                    </span>
                                    <span>
                                      {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                                    </span>
                                    <span className="text-xs">{call.phone_number}</span>
                                  </div>
                                  {call.notes && (
                                    <p className="text-sm text-muted-foreground mt-2 italic">
                                      "{call.notes}"
                                    </p>
                                  )}
                                  {call.ai_summary && (
                                    <div className="mt-2 p-3 bg-accent rounded-lg">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <p className="text-xs font-semibold">AI Summary</p>
                                      </div>
                                      <p className="text-sm">{call.ai_summary}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setDialNumber(call.phone_number);
                                  handleCall();
                                }}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}

                {activeTab === "scheduled" && (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {scheduledCalls.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No scheduled calls</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Schedule follow-up calls to stay on top of your leads
                          </p>
                          <Button className="mt-4 gap-2" onClick={() => handleOpenSchedule()}>
                            <Plus className="w-4 h-4" />
                            Schedule a Call
                          </Button>
                        </div>
                      ) : (
                        <>
                          {upcomingToday.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Today
                              </h3>
                              {upcomingToday.map((call) => (
                                <Card key={call.id} className="border-primary/30 bg-primary/5 hover-scale">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-3 flex-1">
                                        <div className="mt-1 p-2 rounded-full bg-primary/10">
                                          <Bell className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                          <p className="font-semibold">
                                            {call.contact_name || call.phone_number}
                                          </p>
                                          {call.company_name && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                              <Building2 className="w-3 h-3" />
                                              {call.company_name}
                                            </p>
                                          )}
                                          <p className="text-sm font-medium text-primary">
                                            {getScheduleLabel(call.scheduled_at!)}
                                          </p>
                                          {call.notes && (
                                            <p className="text-sm text-muted-foreground italic">
                                              "{call.notes}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <Button 
                                        size="sm"
                                        onClick={() => {
                                          setDialNumber(call.phone_number);
                                          setSelectedContact(null);
                                          handleCall();
                                        }}
                                        className="gap-2"
                                      >
                                        <Phone className="w-4 h-4" />
                                        Call Now
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}

                          {upcomingTomorrow.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-muted-foreground">Tomorrow</h3>
                              {upcomingTomorrow.map((call) => (
                                <Card key={call.id} className="hover-scale">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-3 flex-1">
                                        <div className="mt-1">
                                          <Calendar className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                          <p className="font-semibold">
                                            {call.contact_name || call.phone_number}
                                          </p>
                                          {call.company_name && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                              <Building2 className="w-3 h-3" />
                                              {call.company_name}
                                            </p>
                                          )}
                                          <p className="text-sm text-muted-foreground">
                                            {getScheduleLabel(call.scheduled_at!)}
                                          </p>
                                          {call.notes && (
                                            <p className="text-sm text-muted-foreground italic">
                                              "{call.notes}"
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setDialNumber(call.phone_number);
                                          setSelectedContact(null);
                                          handleCall();
                                        }}
                                        className="gap-2"
                                      >
                                        <Phone className="w-4 h-4" />
                                        Call
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}

                          {scheduledCalls.filter(c => !isToday(new Date(c.scheduled_at!)) && !isTomorrow(new Date(c.scheduled_at!))).length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-semibold text-muted-foreground">Later</h3>
                              {scheduledCalls
                                .filter(c => !isToday(new Date(c.scheduled_at!)) && !isTomorrow(new Date(c.scheduled_at!)))
                                .map((call) => (
                                  <Card key={call.id} className="hover-scale">
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                          <div className="mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                          </div>
                                          <div className="flex-1 space-y-1">
                                            <p className="font-semibold">
                                              {call.contact_name || call.phone_number}
                                            </p>
                                            {call.company_name && (
                                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {call.company_name}
                                              </p>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                              {getScheduleLabel(call.scheduled_at!)}
                                            </p>
                                            {call.notes && (
                                              <p className="text-sm text-muted-foreground italic">
                                                "{call.notes}"
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <Button 
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setDialNumber(call.phone_number);
                                            setSelectedContact(null);
                                            handleCall();
                                          }}
                                        >
                                          <Phone className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Log Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Log Call
            </DialogTitle>
            <DialogDescription>
              {selectedContact 
                ? `Calling ${selectedContact.first_name} ${selectedContact.last_name}`
                : `Calling ${dialNumber}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center p-4 bg-accent rounded-lg">
              <p className="text-2xl font-bold">{dialNumber}</p>
              {selectedContact && (
                <p className="text-muted-foreground">
                  {selectedContact.companies?.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Call Status</Label>
                <Select value={callStatus} onValueChange={setCallStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (MM:SS)</Label>
                <Input
                  placeholder="05:30"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="What was discussed..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>
              Cancel
            </Button>
            <Button onClick={logCall}>
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Call Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Schedule Follow-up Call
            </DialogTitle>
            <DialogDescription>
              Set a reminder to call {selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : dialNumber || "this number"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {(selectedContact || dialNumber) && (
              <div className="text-center p-4 bg-accent rounded-lg">
                <p className="text-xl font-bold">
                  {selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : dialNumber}
                </p>
                {selectedContact?.phone && (
                  <p className="text-muted-foreground">{selectedContact.phone}</p>
                )}
                {selectedContact?.companies?.name && (
                  <p className="text-sm text-muted-foreground">{selectedContact.companies.name}</p>
                )}
              </div>
            )}

            {!selectedContact && !dialNumber && (
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="Enter phone number"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="What do you want to discuss..."
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowScheduleDialog(false);
              setScheduleDate("");
              setScheduleTime("");
              setScheduleNotes("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={scheduleCall}
              disabled={!dialNumber || !scheduleDate || !scheduleTime}
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Schedule Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}