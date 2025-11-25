import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, PhoneCall, PhoneIncoming, PhoneMissed, Clock, Search, Play, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const callHistory = [
  { id: 1, name: "John Smith", company: "Tech Corp", type: "outgoing", duration: "12:34", status: "completed", time: "2 hours ago", aiSummary: "Discussed Q4 pricing and scheduled follow-up demo." },
  { id: 2, name: "Sarah Johnson", company: "Marketing Inc", type: "incoming", duration: "08:15", status: "completed", time: "4 hours ago", aiSummary: "Customer interested in upgrading to enterprise plan." },
  { id: 3, name: "Mike Wilson", company: "Sales Co", type: "outgoing", duration: "00:00", status: "missed", time: "Yesterday", aiSummary: null },
  { id: 4, name: "Emily Brown", company: "Design Studio", type: "incoming", duration: "15:42", status: "completed", time: "Yesterday", aiSummary: "Technical support call resolved successfully." },
  { id: 5, name: "David Lee", company: "Consulting Ltd", type: "outgoing", duration: "06:23", status: "completed", time: "2 days ago", aiSummary: "Initial consultation call, high interest level." },
];

export default function Calls() {
  const [dialNumber, setDialNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const getCallIcon = (type: string, status: string) => {
    if (status === "missed") return <PhoneMissed className="w-4 h-4 text-destructive" />;
    if (type === "incoming") return <PhoneIncoming className="w-4 h-4 text-green-500" />;
    return <Phone className="w-4 h-4 text-primary" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "missed": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const handleDialClick = (digit: string) => {
    setDialNumber(prev => prev + digit);
  };

  const handleCall = () => {
    if (dialNumber) {
      console.log("Calling:", dialNumber);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DashboardNav />
      
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Call Dialer
            </h1>
            <p className="text-muted-foreground mt-2">
              Make calls and track your communication history
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <PhoneCall className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,284</div>
                <p className="text-xs text-muted-foreground">+18% from last month</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9:42</div>
                <p className="text-xs text-muted-foreground">minutes per call</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <PhoneIncoming className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.5%</div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missed Calls</CardTitle>
                <PhoneMissed className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dial Pad */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Dial Pad</CardTitle>
                <CardDescription>Enter number or search contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="text-2xl text-center h-14"
                />
                
                <div className="grid grid-cols-3 gap-3">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
                    <Button
                      key={digit}
                      variant="outline"
                      size="lg"
                      onClick={() => handleDialClick(digit)}
                      className="h-16 text-xl font-semibold hover-scale"
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
                    onClick={handleCall}
                    disabled={!dialNumber}
                    className="flex-1 gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Call History */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Call History</CardTitle>
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
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {callHistory.map((call) => (
                      <Card key={call.id} className="hover-scale">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1">
                                {getCallIcon(call.type, call.status)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold">{call.name}</p>
                                  <Badge className={getStatusColor(call.status)}>
                                    {call.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{call.company}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {call.duration}
                                  </span>
                                  <span>{call.time}</span>
                                </div>
                                {call.aiSummary && (
                                  <div className="mt-2 p-3 bg-accent rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Sparkles className="w-4 h-4 text-primary" />
                                      <p className="text-xs font-semibold">AI Summary</p>
                                    </div>
                                    <p className="text-sm">{call.aiSummary}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button variant="ghost" size="icon">
                                <Phone className="w-4 h-4" />
                              </Button>
                              {call.status === "completed" && (
                                <Button variant="ghost" size="icon">
                                  <Play className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
