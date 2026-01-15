import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Rate limit configurations for different action types
export const RATE_LIMIT_CONFIG = {
  role_change: { maxRequests: 10, windowMinutes: 60 },
  data_export: { maxRequests: 5, windowMinutes: 60 },
  data_import: { maxRequests: 10, windowMinutes: 60 },
  password_change: { maxRequests: 3, windowMinutes: 60 },
  login_attempt: { maxRequests: 5, windowMinutes: 15 },
  team_invite: { maxRequests: 20, windowMinutes: 60 },
  settings_change: { maxRequests: 30, windowMinutes: 60 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMIT_CONFIG;

interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  maxRequests: number;
  remaining?: number;
  retryAfterSeconds?: number;
}

interface RateLimitResponse {
  allowed: boolean;
  current_count: number;
  max_requests: number;
  remaining?: number;
  retry_after_seconds?: number;
}

export const useRateLimiter = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const checkRateLimit = useCallback(
    async (actionType: RateLimitAction): Promise<RateLimitResult> => {
      if (!user) {
        return {
          allowed: false,
          currentCount: 0,
          maxRequests: 0,
        };
      }

      const config = RATE_LIMIT_CONFIG[actionType];

      try {
        const { data, error } = await supabase.rpc("check_rate_limit", {
          p_user_id: user.id,
          p_action_type: actionType,
          p_max_requests: config.maxRequests,
          p_window_minutes: config.windowMinutes,
        });

        if (error) {
          console.error("Rate limit check failed:", error);
          // On error, allow the action but log it
          return {
            allowed: true,
            currentCount: 0,
            maxRequests: config.maxRequests,
          };
        }

        const response = data as unknown as RateLimitResponse;
        
        const result: RateLimitResult = {
          allowed: response.allowed,
          currentCount: response.current_count,
          maxRequests: response.max_requests,
          remaining: response.remaining,
          retryAfterSeconds: response.retry_after_seconds,
        };

        if (!result.allowed) {
          const retryMinutes = Math.ceil((result.retryAfterSeconds || 0) / 60);
          toast({
            title: "Rate Limit Exceeded",
            description: `Too many ${actionType.replace(/_/g, " ")} attempts. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}.`,
            variant: "destructive",
          });
        }

        return result;
      } catch (err) {
        console.error("Error checking rate limit:", err);
        // On error, allow the action
        return {
          allowed: true,
          currentCount: 0,
          maxRequests: config.maxRequests,
        };
      }
    },
    [user, toast]
  );

  const withRateLimit = useCallback(
    async <T>(
      actionType: RateLimitAction,
      action: () => Promise<T>
    ): Promise<T | null> => {
      const rateLimit = await checkRateLimit(actionType);
      
      if (!rateLimit.allowed) {
        return null;
      }

      return action();
    },
    [checkRateLimit]
  );

  return {
    checkRateLimit,
    withRateLimit,
  };
};
