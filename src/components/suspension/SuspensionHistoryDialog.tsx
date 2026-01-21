import { useSuspensionHistory, SuspensionHistoryEntry } from "@/hooks/useSuspensionHistory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  UserX,
  UserCheck,
  Edit,
  Ban,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface SuspensionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userName?: string | null;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "suspended":
      return <UserX className="w-4 h-4 text-warning" />;
    case "blocked":
      return <Ban className="w-4 h-4 text-destructive" />;
    case "lifted":
      return <UserCheck className="w-4 h-4 text-primary" />;
    case "modified":
      return <Edit className="w-4 h-4 text-accent-foreground" />;
    default:
      return <History className="w-4 h-4 text-muted-foreground" />;
  }
};

const getActionBadge = (action: string) => {
  switch (action) {
    case "suspended":
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
          Suspended
        </Badge>
      );
    case "blocked":
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          Blocked
        </Badge>
      );
    case "lifted":
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          Lifted
        </Badge>
      );
    case "modified":
      return (
        <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent">
          Modified
        </Badge>
      );
    default:
      return <Badge variant="secondary">{action}</Badge>;
  }
};

export const SuspensionHistoryDialog = ({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName,
}: SuspensionHistoryDialogProps) => {
  const { history, isLoading } = useSuspensionHistory(open ? userId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Suspension History
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            History for {userName || userEmail}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-1 p-1">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="relative pl-8 pb-6 last:pb-0"
                >
                  {/* Timeline line */}
                  {index < history.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
                  )}
                  
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center">
                    {getActionIcon(entry.action)}
                  </div>

                  {/* Content */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        {getActionBadge(entry.action)}
                        <p className="text-sm font-medium mt-2">
                          {entry.action === "suspended" && "User was temporarily suspended"}
                          {entry.action === "blocked" && "User was permanently blocked"}
                          {entry.action === "lifted" && "Suspension was lifted"}
                          {entry.action === "modified" && "Suspension was modified"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(entry.created_at), "MMM d, yyyy")}
                        </div>
                        <div>{format(new Date(entry.created_at), "h:mm a")}</div>
                      </div>
                    </div>

                    {entry.reason && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reason: </span>
                        <span>{entry.reason}</span>
                      </div>
                    )}

                    {entry.suspended_until && entry.action !== "lifted" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        Until: {format(new Date(entry.suspended_until), "MMM d, yyyy h:mm a")}
                      </div>
                    )}

                    {!entry.suspended_until && entry.action === "blocked" && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <Ban className="w-3.5 h-3.5" />
                        Permanent block
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <User className="w-3 h-3" />
                      <span>By: {entry.performed_by_email || "Unknown"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No suspension history for this user
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
