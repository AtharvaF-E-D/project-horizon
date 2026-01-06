import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { PipelineColumn } from "@/components/pipeline/PipelineColumn";
import { DealCard } from "@/components/pipeline/DealCard";

type DealStage = "prospecting" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

interface Deal {
  id: string;
  title: string;
  value: number | null;
  stage: DealStage | null;
  company?: { name: string } | null;
  contact?: { first_name: string; last_name: string } | null;
}

const stages = [
  { id: "prospecting", name: "Prospecting", color: "border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800" },
  { id: "qualification", name: "Qualification", color: "border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800" },
  { id: "proposal", name: "Proposal", color: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800" },
  { id: "negotiation", name: "Negotiation", color: "border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800" },
  { id: "closed_won", name: "Closed Won", color: "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800" },
  { id: "closed_lost", name: "Closed Lost", color: "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800" },
];

const Pipeline = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          id,
          title,
          value,
          stage,
          company:companies(name),
          contact:contacts(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load deals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeDeal = deals.find((d) => d.id === activeId);
    if (!activeDeal) return;

    // Check if dropping over a column
    const overStage = stages.find((s) => s.id === overId);
    if (overStage && activeDeal.stage !== overStage.id) {
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === activeId ? { ...deal, stage: overStage.id as DealStage } : deal
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeDeal = deals.find((d) => d.id === activeId);
    if (!activeDeal) return;

    // Determine the target stage
    let targetStage: string | null = null;
    
    // Check if dropped on a stage column
    const overStage = stages.find((s) => s.id === overId);
    if (overStage) {
      targetStage = overStage.id;
    } else {
      // Check if dropped on another deal - use that deal's stage
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) {
        targetStage = overDeal.stage;
      }
    }

    if (targetStage && targetStage !== activeDeal.stage) {
      // Update in database
      try {
        const { error } = await supabase
          .from("deals")
          .update({ stage: targetStage as DealStage })
          .eq("id", activeId);

        if (error) throw error;

        toast({
          title: "Deal moved",
          description: `"${activeDeal.title}" moved to ${stages.find((s) => s.id === targetStage)?.name}`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to update deal stage",
          variant: "destructive",
        });
        // Revert the optimistic update
        fetchDeals();
      }
    }
  };

  const getDealsByStage = (stageId: string) => {
    return deals.filter((deal) => deal.stage === stageId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <DashboardNav />
        <main className="ml-64 pt-16 p-8 flex items-center justify-center">
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
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-2">Sales Pipeline</h1>
              <p className="text-muted-foreground">
                Drag and drop deals between stages • {deals.length} total deals
              </p>
            </div>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={() => navigate("/deals/new")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </div>

          {/* Pipeline Stats */}
          <div className="grid grid-cols-6 gap-4">
            {stages.map((stage) => {
              const stageDeals = getDealsByStage(stage.id);
              const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {stages.map((stage) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  deals={getDealsByStage(stage.id)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeDeal ? <DealCard deal={activeDeal} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>
    </div>
  );
};

export default Pipeline;
