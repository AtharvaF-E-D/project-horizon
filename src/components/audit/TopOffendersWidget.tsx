import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Ban, Trophy, TrendingUp, Shield } from "lucide-react";

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

export const TopOffendersWidget = ({ logs }: TopOffendersWidgetProps) => {
  const offenders = useMemo(() => {
    const userMap = new Map<string, {
      email: string;
      warnings: number;
      exceeded: number;
      lastViolation: string;
      actions: Record<string, number>;
      recentViolations: number;
      olderViolations: number;
    }>();

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
        const mostFrequentAction = Object.entries(data.actions).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] || "unknown";

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
                <span>Most affected: {formatActionType(offender.mostFrequentAction)}</span>
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
            <div className="w-24">
              <Progress
                value={(offender.totalViolations / maxViolations) * 100}
                className="h-2"
              />
              <p className="text-xs text-center text-muted-foreground mt-1">
                {offender.totalViolations} total
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
