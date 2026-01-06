import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, DollarSign, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Deal {
  id: string;
  title: string;
  value: number | null;
  company?: { name: string } | null;
  contact?: { first_name: string; last_name: string } | null;
}

interface DealCardProps {
  deal: Deal;
}

export const DealCard = ({ deal }: DealCardProps) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const contactInitials = deal.contact
    ? `${deal.contact.first_name[0]}${deal.contact.last_name[0]}`
    : "?";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 bg-card hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/deals/${deal.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-sm">{deal.title}</h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/deals/${deal.id}`);
          }}
        >
          <MoreVertical className="w-3 h-3" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        {deal.company?.name || "No company"}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-semibold text-primary">
          <DollarSign className="w-3 h-3" />
          {deal.value ? `${(deal.value / 1000).toFixed(1)}K` : "0"}
        </div>
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-semibold">
          {contactInitials}
        </div>
      </div>
    </Card>
  );
};
