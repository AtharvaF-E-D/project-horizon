import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useMemo } from "react";
import { 
  startOfDay, 
  subDays, 
  format, 
  differenceInHours,
  differenceInDays,
  parseISO
} from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface SuspensionHistoryRow {
  id: string;
  user_id: string;
  action: string;
  suspended_until: string | null;
  reason: string | null;
  performed_by: string;
  performed_by_email: string | null;
  created_at: string;
  metadata: Json;
}

export interface SuspensionTrendData {
  date: string;
  suspended: number;
  modified: number;
  lifted: number;
  blocked: number;
}

export interface ReasonBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

export interface DurationStats {
  averageHours: number;
  medianHours: number;
  shortestHours: number;
  longestHours: number;
  permanentCount: number;
  temporaryCount: number;
}

export interface SuspensionStats {
  totalSuspensions: number;
  totalBlocks: number;
  totalLifted: number;
  totalModified: number;
  activeNow: number;
  trends: SuspensionTrendData[];
  reasonBreakdown: ReasonBreakdown[];
  durationStats: DurationStats;
  topPerformers: { email: string; count: number }[];
}

export const useSuspensionStats = (days: number = 30) => {
  const { user } = useAuth();

  const { data: history, isLoading, error } = useQuery({
    queryKey: ["suspension-stats", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      
      const { data, error } = await supabase
        .from("suspension_history")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as SuspensionHistoryRow[];
    },
    enabled: !!user,
  });

  // Fetch currently suspended users count
  const { data: activeSuspensions } = useQuery({
    queryKey: ["active-suspensions-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .or("is_active.eq.false,suspended_until.gt.now()");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const stats = useMemo((): SuspensionStats => {
    if (!history) {
      return {
        totalSuspensions: 0,
        totalBlocks: 0,
        totalLifted: 0,
        totalModified: 0,
        activeNow: 0,
        trends: [],
        reasonBreakdown: [],
        durationStats: {
          averageHours: 0,
          medianHours: 0,
          shortestHours: 0,
          longestHours: 0,
          permanentCount: 0,
          temporaryCount: 0,
        },
        topPerformers: [],
      };
    }

    // Count by action type
    const totalSuspensions = history.filter(h => h.action === "suspended").length;
    const totalBlocks = history.filter(h => h.action === "blocked").length;
    const totalLifted = history.filter(h => h.action === "lifted").length;
    const totalModified = history.filter(h => h.action === "modified").length;

    // Build trend data by day
    const trendMap = new Map<string, SuspensionTrendData>();
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      trendMap.set(date, { date, suspended: 0, modified: 0, lifted: 0, blocked: 0 });
    }

    history.forEach(entry => {
      const date = format(parseISO(entry.created_at), "yyyy-MM-dd");
      const existing = trendMap.get(date);
      if (existing) {
        const action = entry.action as keyof Omit<SuspensionTrendData, "date">;
        if (action in existing) {
          existing[action]++;
        }
      }
    });

    const trends = Array.from(trendMap.values());

    // Reason breakdown
    const reasonCounts = new Map<string, number>();
    history
      .filter(h => h.action === "suspended" || h.action === "blocked")
      .forEach(entry => {
        const reason = entry.reason || "No reason provided";
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
      });

    const totalWithReasons = totalSuspensions + totalBlocks;
    const reasonBreakdown: ReasonBreakdown[] = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({
        reason: reason.length > 50 ? reason.substring(0, 47) + "..." : reason,
        count,
        percentage: totalWithReasons > 0 ? Math.round((count / totalWithReasons) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Duration stats (for temporary suspensions)
    const durations: number[] = [];
    let permanentCount = 0;
    
    history
      .filter(h => h.action === "suspended" || h.action === "modified")
      .forEach(entry => {
        if (!entry.suspended_until) {
          permanentCount++;
        } else {
          const createdAt = parseISO(entry.created_at);
          const suspendedUntil = parseISO(entry.suspended_until);
          const hours = differenceInHours(suspendedUntil, createdAt);
          if (hours > 0) {
            durations.push(hours);
          }
        }
      });

    // Also count blocked as permanent
    permanentCount += totalBlocks;

    const sortedDurations = [...durations].sort((a, b) => a - b);
    const durationStats: DurationStats = {
      averageHours: durations.length > 0 
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
        : 0,
      medianHours: sortedDurations.length > 0 
        ? sortedDurations[Math.floor(sortedDurations.length / 2)] 
        : 0,
      shortestHours: sortedDurations.length > 0 ? sortedDurations[0] : 0,
      longestHours: sortedDurations.length > 0 ? sortedDurations[sortedDurations.length - 1] : 0,
      permanentCount,
      temporaryCount: durations.length,
    };

    // Top performers (admins who performed suspensions)
    const performerCounts = new Map<string, number>();
    history.forEach(entry => {
      const email = entry.performed_by_email || "Unknown";
      performerCounts.set(email, (performerCounts.get(email) || 0) + 1);
    });

    const topPerformers = Array.from(performerCounts.entries())
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSuspensions,
      totalBlocks,
      totalLifted,
      totalModified,
      activeNow: activeSuspensions || 0,
      trends,
      reasonBreakdown,
      durationStats,
      topPerformers,
    };
  }, [history, activeSuspensions, days]);

  return {
    stats,
    isLoading,
    error,
  };
};
