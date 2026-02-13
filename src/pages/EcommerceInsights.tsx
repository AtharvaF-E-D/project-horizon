import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, TrendingUp, Package, Users, DollarSign, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react";

const topProducts = [
  { name: "Enterprise CRM License", revenue: 125000, units: 25, growth: 15 },
  { name: "Professional Plan", revenue: 89000, units: 178, growth: 22 },
  { name: "Starter Plan", revenue: 45000, units: 450, growth: 8 },
  { name: "Training Package", revenue: 32000, units: 64, growth: -5 },
  { name: "Integration Add-on", revenue: 28000, units: 140, growth: 35 },
];

const recentOrders = [
  { id: "ORD-001", customer: "TechCorp", product: "Enterprise License", amount: 5000, status: "completed", date: "2026-02-13" },
  { id: "ORD-002", customer: "StartupXYZ", product: "Professional Plan", amount: 500, status: "processing", date: "2026-02-13" },
  { id: "ORD-003", customer: "Digital Agency", product: "Training Package", amount: 1500, status: "completed", date: "2026-02-12" },
  { id: "ORD-004", customer: "Global Retail", product: "Integration Add-on", amount: 200, status: "pending", date: "2026-02-12" },
  { id: "ORD-005", customer: "Enterprise Co", product: "Enterprise License", amount: 5000, status: "completed", date: "2026-02-11" },
];

const statusColors: Record<string, string> = {
  completed: "bg-green-500/10 text-green-600",
  processing: "bg-blue-500/10 text-blue-600",
  pending: "bg-yellow-500/10 text-yellow-600",
};

export default function EcommerceInsights() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">E-commerce Insights</h1>
            <p className="text-muted-foreground mt-2">Track product performance, revenue, and customer purchasing patterns</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center"><DollarSign className="h-6 w-6 text-primary-foreground" /></div><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">$319K</p><span className="text-xs text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3" />+18.2%</span></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center"><ShoppingCart className="h-6 w-6 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">857</p><span className="text-xs text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3" />+12.5%</span></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Avg Order Value</p><p className="text-2xl font-bold">$372</p><span className="text-xs text-green-500 flex items-center"><ArrowUpRight className="w-3 h-3" />+5.1%</span></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center"><Users className="h-6 w-6 text-secondary" /></div><div><p className="text-sm text-muted-foreground">Active Customers</p><p className="text-2xl font-bold">2,341</p><span className="text-xs text-red-500 flex items-center"><ArrowDownRight className="w-3 h-3" />-2.3%</span></div></div></CardContent></Card>
          </div>

          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Top Products</TabsTrigger>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Product Performance</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-bold">${product.revenue.toLocaleString()}</p>
                            <span className={`text-xs flex items-center justify-end ${product.growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {product.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {Math.abs(product.growth)}%
                            </span>
                          </div>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(product.revenue / 125000) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.customer} — {order.product}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                          <p className="font-bold">${order.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}