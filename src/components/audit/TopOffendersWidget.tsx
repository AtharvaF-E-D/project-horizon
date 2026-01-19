import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Ban,
  Trophy,
  TrendingUp,
  Shield,
  Clock,
  UserX,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SecurityAuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface TopOffendersWidgetProps {
  logs: SecurityAuditLog[];
}

interface OffenderData {
  userId: string;
  email: string;
  totalViolations: number;
  warnings: number;
  exceeded: number;
  lastViolation: string;
  mostFrequentAction: string;
  recentTrend: "increasing" | "stable" | "decreasing";
}

type SuspensionDuration = "1h" | "24h" | "7d" | "30d" | "permanent";

const SUSPENSION_OPTIONS: { value: SuspensionDuration; label: string }[] = [
  { value: "1h", label: "1 Hour" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "permanent", label: "Permanent" },
];

const getSuspensionEndDate = (duration: SuspensionDuration): Date | null => {
  const now = new Date();
  switch (duration) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "permanent":
      return null; // Use is_active = false for permanent
    default:
      return null;
  }
};

export const TopOffendersWidget = ({ logs }: TopOffendersWidgetProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedOffender, setSelectedOffender] = useState<OffenderData | null>(null);
  const [suspensionDuration, setSuspensionDuration] = useState<SuspensionDuration>("24h");
  const [suspensionReason, setSuspensionReason] = useState("");

  const suspendUserMutation = useMutation({
    mutationFn: async ({
      userId,
      duration,
      reason,
    }: {
      userId: string;
      duration: SuspensionDuration;
      reason: string;
    }) => {
      const endDate = getSuspensionEndDate(duration);
      const isPermanent = duration === "permanent";

      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: isPermanent ? false : true,
          suspended_until: endDate?.toISOString() || null,
          suspension_reason: reason || `Rate limit violations - ${duration} suspension`,
        })
        .eq("id", userId);

      if (error) throw error;

      // Log the suspension in audit logs
      const { error: auditError } = await supabase.from("audit_logs").insert({
        user_id: user?.id || "",
        user_email: user?.email || null,
        action: isPermanent ? "user_blocked" : "user_suspended",
        entity_type: "user_suspension",
        entity_id: userId,
        details: {
          target_user_id: userId,
          duration,
          reason,
          suspended_until: endDate?.toISOString() || "permanent",
        },
      });

      if (auditError) {
        console.error("Failed to log suspension:", auditError);
      }

      return { userId, duration, isPermanent };
    },
    onSuccess: (data) => {
      toast.success(
        data.isPermanent
          ? "User has been permanently blocked"
          : `User suspended for ${data.duration}`
      );
      queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
      setSuspendDialogOpen(false);
      setSelectedOffender(null);
      setSuspensionReason("");
      setSuspensionDuration("24h");
    },
    onError: (error) => {
      console.error("Suspension error:", error);
      toast.error("Failed to suspend user. Make sure you have admin permissions.");
    },
  });

  const offenders = useMemo(() => {
    const userMap = new Map<
      string,
      {
        email: string;
        warnings: number;
        exceeded: number;
        lastViolation: string;
        actions: Record<string, number>;
        recentViolations: number;
        olderViolations: number;
      }
    >();

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    logs.forEach((log) => {
      const existing = userMap.get(log.user_id) || {
        email: log.user_email || "Unknown",
        warnings: 0,
        exceeded: 0,
        lastViolation: log.created_at,
        actions: {},
        recentViolations: 0,
        olderViolations: 0,
      };

      if (log.action === "rate_limit_warning") {
        existing.warnings++;
      } else if (log.action === "rate_limit_exceeded") {
        existing.exceeded++;
      }

      // Track action types
      const actionType = log.entity_id || "unknown";
      existing.actions[actionType] = (existing.actions[actionType] || 0) + 1;

      // Track trend (recent vs older)
      const logDate = new Date(log.created_at);
      if (logDate > threeDaysAgo) {
        existing.recentViolations++;
      } else if (logDate > sevenDaysAgo) {
        existing.olderViolations++;
      }

      // Update last violation
      if (new Date(log.created_at) > new Date(existing.lastViolation)) {
        existing.lastViolation = log.created_at;
      }

      userMap.set(log.user_id, existing);
    });

    // Convert to array and sort by total violations
    const offenderList: OffenderData[] = Array.from(userMap.entries()).map(
      ([userId, data]) => {
        const totalViolations = data.warnings + data.exceeded;
        const mostFrequentAction =
          Object.entries(data.actions).sort(([, a], [, b]) => b - a)[0]?.[0] ||
          "unknown";

        // Determine trend
        let trend: "increasing" | "stable" | "decreasing" = "stable";
        if (data.recentViolations > data.olderViolations * 1.5) {
          trend = "increasing";
        } else if (data.recentViolations < data.olderViolations * 0.5) {
          trend = "decreasing";
        }

        return {
          userId,
          email: data.email,
          totalViolations,
          warnings: data.warnings,
          exceeded: data.exceeded,
          lastViolation: data.lastViolation,
          mostFrequentAction,
          recentTrend: trend,
        };
      }
    );

    return offenderList
      .sort((a, b) => b.totalViolations - a.totalViolations)
      .slice(0, 5);
  }, [logs]);

  const maxViolations = offenders[0]?.totalViolations || 1;

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getInitials = (email: string) => {
    const parts = email.split("@")[0].split(/[._-]/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-amber-500 text-white";
      case 1:
        return "bg-slate-400 text-white";
      case 2:
        return "bg-amber-700 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTrendIcon = (trend: "increasing" | "stable" | "decreasing") => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="w-3 h-3 text-red-500" />;
      case "decreasing":
        return <TrendingUp className="w-3 h-3 text-green-500 rotate-180" />;
      default:
        return null;
    }
  };

  const formatActionType = (action: string) => {
    return action
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const handleSuspendClick = (offender: OffenderData) => {
    setSelectedOffender(offender);
    setSuspensionReason(
      `Excessive rate limit violations: ${offender.exceeded} exceeded, ${offender.warnings} warnings`
    );
    setSuspendDialogOpen(true);
  };

  const handleConfirmSuspension = () => {
    if (!selectedOffender) return;
    suspendUserMutation.mutate({
      userId: selectedOffender.userId,
      duration: suspensionDuration,
      reason: suspensionReason,
    });
  };

  if (offenders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top Rate Limit Offenders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No rate limit violations found. All users are within limits!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top Rate Limit Offenders
            <Badge variant="secondary" className="ml-auto">
              {logs.length} total violations
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {offenders.map((offender, index) => (
            <div
              key={offender.userId}
              className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              {/* Rank Badge */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getRankColor(
                  index
                )}`}
              >
                {index + 1}
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(offender.email)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{offender.email}</p>
                  {getTrendIcon(offender.recentTrend)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Most affected: {formatActionType(offender.mostFrequentAction)}
                  </span>
                  <span>•</span>
                  <span>Last: {formatTimeAgo(offender.lastViolation)}</span>
                </div>
              </div>

              {/* Violation Stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1" title="90% Warnings">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">{offender.warnings}</span>
                </div>
                <div className="flex items-center gap-1" title="Exceeded">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">{offender.exceeded}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-20">
                <Progress
                  value={(offender.totalViolations / maxViolations) * 100}
                  className="h-2"
                />
                <p className="text-xs text-center text-muted-foreground mt-1">
                  {offender.totalViolations} total
                </p>
              </div>

              {/* Suspend Button */}
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={() => handleSuspendClick(offender)}
              >
                <UserX className="w-3.5 h-3.5" />
                Suspend
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suspension Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-destructive" />
              Suspend User
            </DialogTitle>
            <DialogDescription>
              Suspend{" "}
              <span className="font-medium text-foreground">
                {selectedOffender?.email}
              </span>{" "}
              for rate limit violations. They will be unable to access the system
              during the suspension period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm">
                  <span className="font-medium">{selectedOffender?.warnings}</span>{" "}
                  warnings
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                <span className="text-sm">
                  <span className="font-medium">{selectedOffender?.exceeded}</span>{" "}
                  exceeded
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Suspension Duration
              </Label>
              <Select
                value={suspensionDuration}
                onValueChange={(v) => setSuspensionDuration(v as SuspensionDuration)}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {SUSPENSION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Suspension</Label>
              <Textarea
                id="reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={suspendUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSuspension}
              disabled={suspendUserMutation.isPending}
            >
              {suspendUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suspending...
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4 mr-2" />
                  Confirm Suspension
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
