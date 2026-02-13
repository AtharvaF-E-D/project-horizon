import { useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus, Search, FileText, Send, Download, Eye, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  createdAt: string;
  items: { description: string; quantity: number; price: number }[];
}

const mockInvoices: Invoice[] = [
  { id: "1", number: "INV-001", client: "TechCorp Solutions", amount: 12500, status: "paid", dueDate: "2026-01-15", createdAt: "2026-01-01", items: [{ description: "CRM Setup", quantity: 1, price: 10000 }, { description: "Training", quantity: 5, price: 500 }] },
  { id: "2", number: "INV-002", client: "StartupXYZ", amount: 8300, status: "sent", dueDate: "2026-02-28", createdAt: "2026-02-01", items: [{ description: "Monthly Retainer", quantity: 1, price: 8300 }] },
  { id: "3", number: "INV-003", client: "Enterprise Co", amount: 25000, status: "overdue", dueDate: "2026-01-30", createdAt: "2026-01-10", items: [{ description: "Enterprise License", quantity: 1, price: 25000 }] },
  { id: "4", number: "INV-004", client: "Digital Agency", amount: 5600, status: "draft", dueDate: "2026-03-15", createdAt: "2026-02-10", items: [{ description: "Consulting", quantity: 8, price: 700 }] },
  { id: "5", number: "INV-005", client: "Global Retail", amount: 18900, status: "paid", dueDate: "2026-02-01", createdAt: "2026-01-15", items: [{ description: "Platform Integration", quantity: 1, price: 18900 }] },
];

const statusConfig: Record<string, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  paid: { label: "Paid", class: "bg-green-500/10 text-green-600 border-green-500/20" },
  overdue: { label: "Overdue", class: "bg-red-500/10 text-red-600 border-red-500/20" },
  cancelled: { label: "Cancelled", class: "bg-muted text-muted-foreground" },
};

export default function Invoices() {
  const { toast } = useToast();
  const [invoices] = useState(mockInvoices);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.client.toLowerCase().includes(search.toLowerCase()) || inv.number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Invoices & Payments</h1>
              <p className="text-muted-foreground mt-2">Manage your invoices, track payments, and monitor revenue</p>
            </div>
            <Button className="gradient-primary text-primary-foreground" onClick={() => toast({ title: "Coming soon", description: "Invoice creation will be available shortly." })}>
              <Plus className="w-4 h-4 mr-2" /> New Invoice
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center"><DollarSign className="h-6 w-6 text-primary-foreground" /></div><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center"><Clock className="h-6 w-6 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">${totalPending.toLocaleString()}</p></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-red-500" /></div><div><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold">${totalOverdue.toLocaleString()}</p></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Total Invoices</p><p className="text-2xl font-bold">{invoices.length}</p></div></div></CardContent></Card>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filtered.map(invoice => (
              <Card key={invoice.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{invoice.number}</h3>
                          <Badge className={statusConfig[invoice.status].class}>{statusConfig[invoice.status].label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{invoice.client}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xl font-bold">${invoice.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button>
                        {invoice.status === "draft" && <Button variant="ghost" size="icon"><Send className="w-4 h-4" /></Button>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}