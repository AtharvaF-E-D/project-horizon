import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Plus, MoreVertical, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Pipeline = () => {
  const stages = [
    { id: 1, name: "Qualified", color: "border-blue-300 bg-blue-50" },
    { id: 2, name: "Contacted", color: "border-purple-300 bg-purple-50" },
    { id: 3, name: "Proposal", color: "border-yellow-300 bg-yellow-50" },
    { id: 4, name: "Negotiation", color: "border-orange-300 bg-orange-50" },
    { id: 5, name: "Won", color: "border-green-300 bg-green-50" },
  ];

  const deals = {
    1: [
      { id: 1, name: "TechCorp Deal", company: "TechCorp", value: 12500, contact: "Sarah Johnson" },
      { id: 2, name: "Business Inc Deal", company: "Business Inc", value: 15000, contact: "John Smith" },
    ],
    2: [
      { id: 3, name: "StartupXYZ Deal", company: "StartupXYZ", value: 8300, contact: "Mike Anderson" },
    ],
    3: [
      { id: 4, name: "Company Ltd Deal", company: "Company Ltd", value: 18700, contact: "Lisa Chen" },
    ],
    4: [
      { id: 5, name: "Enterprise Co Deal", company: "Enterprise Co", value: 25000, contact: "Emily Davis" },
    ],
    5: [],
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      
      <main className="ml-64 pt-16 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2">Sales Pipeline</h1>
              <p className="text-muted-foreground">Drag and drop deals between stages</p>
            </div>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </div>

          {/* Pipeline Stats */}
          <div className="grid grid-cols-5 gap-4">
            {stages.map((stage) => {
              const stageDeals = deals[stage.id as keyof typeof deals] || [];
              const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
              return (
                <Card key={stage.id} className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">{stage.name}</div>
                  <div className="text-2xl font-bold">${(totalValue / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-muted-foreground mt-1">{stageDeals.length} deals</div>
                </Card>
              );
            })}
          </div>

          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageDeals = deals[stage.id as keyof typeof deals] || [];
              return (
                <div key={stage.id} className="flex-shrink-0 w-80">
                  <Card className={`p-4 ${stage.color} border-2`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-semibold">{stage.name}</div>
                      <Badge variant="secondary">{stageDeals.length}</Badge>
                    </div>

                    <div className="space-y-3">
                      {stageDeals.map((deal) => (
                        <Card 
                          key={deal.id} 
                          className="p-4 bg-card hover:shadow-md transition-smooth cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{deal.name}</h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground mb-3">{deal.company}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                              <DollarSign className="w-3 h-3" />
                              {(deal.value / 1000).toFixed(1)}K
                            </div>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-semibold">
                              {deal.contact.split(' ').map(n => n[0]).join('')}
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No deals in this stage
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="ghost" 
                      className="w-full mt-3 text-muted-foreground hover:text-foreground"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Deal
                    </Button>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pipeline;
