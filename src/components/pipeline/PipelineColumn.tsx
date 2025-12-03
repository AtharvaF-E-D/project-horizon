import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DealCard } from "./DealCard";
import { useNavigate } from "react-router-dom";

interface Deal {
  id: string;
  title: string;
  value: number | null;
  company?: { name: string } | null;
  contact?: { first_name: string; last_name: string } | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface PipelineColumnProps {
  stage: Stage;
  deals: Deal[];
}

export const PipelineColumn = ({ stage, deals }: PipelineColumnProps) => {
  const navigate = useNavigate();
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <div className="flex-shrink-0 w-80">
      <Card
        ref={setNodeRef}
        className={`p-4 ${stage.color} border-2 min-h-[400px] transition-all ${
          isOver ? "ring-2 ring-primary ring-offset-2" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">{stage.name}</div>
          <Badge variant="secondary">{deals.length}</Badge>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          ${(totalValue / 1000).toFixed(1)}K total
        </div>

        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3 min-h-[200px]">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}

            {deals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
                Drop deals here
              </div>
            )}
          </div>
        </SortableContext>

        <Button
          variant="ghost"
          className="w-full mt-3 text-muted-foreground hover:text-foreground"
          size="sm"
          onClick={() => navigate("/deals/new")}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Deal
        </Button>
      </Card>
    </div>
  );
};
