import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Navbar } from "@/components/layout/Navbar";
import { Search, Filter, Plus, Mail, Phone, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Leads = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const leads = [
    { id: 1, name: "Sarah Johnson", email: "sarah@techcorp.com", company: "TechCorp", phone: "+1234567890", status: "Hot", value: "$12.5K", source: "Website" },
    { id: 2, name: "Mike Anderson", email: "mike@startupxyz.com", company: "StartupXYZ", phone: "+1234567891", status: "Warm", value: "$8.3K", source: "Referral" },
    { id: 3, name: "Emily Davis", email: "emily@enterprise.com", company: "Enterprise Co", phone: "+1234567892", status: "Cold", value: "$25K", source: "LinkedIn" },
    { id: 4, name: "John Smith", email: "john@business.com", company: "Business Inc", phone: "+1234567893", status: "Hot", value: "$15K", source: "Campaign" },
    { id: 5, name: "Lisa Chen", email: "lisa@company.com", company: "Company Ltd", phone: "+1234567894", status: "Warm", value: "$18.7K", source: "Website" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-red-100 text-red-700 hover:bg-red-200";
      case "Warm": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
      case "Cold": return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DashboardNav />
      
      <main className="ml-64 pt-16 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2">Leads</h1>
              <p className="text-muted-foreground">Manage and track all your leads in one place</p>
            </div>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add New Lead
            </Button>
          </div>

          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search leads by name, company, or email..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline">Export</Button>
            </div>
          </Card>

          {/* Leads Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="font-medium">{lead.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{lead.value}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Leads;
