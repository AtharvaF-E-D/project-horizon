import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface SuspensionHistoryEntry {
  id: string;
  user_id: string;
  action: "suspended" | "modified" | "lifted" | "blocked";
  suspended_until: string | null;
  reason: string | null;
  performed_by: string;
  performed_by_email: string | null;
  created_at: string;
  metadata: Json;
}

export const useSuspensionHistory = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch suspension history for a specific user
  const { data: history, isLoading, error } = useQuery({
    queryKey: ["suspension-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("suspension_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SuspensionHistoryEntry[];
    },
    enabled: !!userId && !!user,
  });

  // Log a suspension event
  const logSuspensionEvent = useMutation({
    mutationFn: async ({
      targetUserId,
      action,
      suspendedUntil,
      reason,
      metadata = {},
    }: {
      targetUserId: string;
      action: "suspended" | "modified" | "lifted" | "blocked";
      suspendedUntil?: string | null;
      reason?: string | null;
      metadata?: Json;
    }) => {
      if (!user) throw new Error("No authenticated user");

      // Get performer's email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("suspension_history").insert([{
        user_id: targetUserId,
        action,
        suspended_until: suspendedUntil || null,
        reason: reason || null,
        performed_by: user.id,
        performed_by_email: profile?.email || user.email,
        metadata,
      }]);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["suspension-history", variables.targetUserId] 
      });
    },
  });

  return {
    history,
    isLoading,
    error,
    logSuspensionEvent: logSuspensionEvent.mutateAsync,
  };
};
