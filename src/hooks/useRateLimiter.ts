import { useCallback, useRef } from "react";
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

// Track which alerts have been sent to avoid duplicates
const alertsSentThisSession: Set<string> = new Set();

export const useRateLimiter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const warningsSent = useRef<Set<string>>(new Set());

  // Log rate limit alert to audit_logs table
  const logRateLimitAudit = useCallback(
    async (
      alertType: "rate_limit_warning" | "rate_limit_exceeded",
      actionType: RateLimitAction,
      currentCount: number,
      maxRequests: number,
      percentage: number
    ) => {
      if (!user) return;

      const config = RATE_LIMIT_CONFIG[actionType];

      try {
        const { error } = await supabase.from("audit_logs").insert({
          user_id: user.id,
          user_email: user.email,
          action: alertType,
          entity_type: "rate_limit",
          entity_id: actionType,
          details: {
            action_type: actionType,
            current_count: currentCount,
            max_requests: maxRequests,
            percentage: Math.round(percentage),
            window_minutes: config.windowMinutes,
            threshold_type: alertType === "rate_limit_warning" ? "90%" : "exceeded",
          },
          user_agent: navigator.userAgent,
        });

        if (error) {
          console.error("Failed to log rate limit audit:", error);
        }
      } catch (err) {
        console.error("Error logging rate limit audit:", err);
      }
    },
    [user]
  );

  // Send rate limit alert to admins
  const sendRateLimitAlert = useCallback(
    async (
      alertType: "rate_limit_warning" | "rate_limit_exceeded",
      actionType: RateLimitAction,
      currentCount: number,
      maxRequests: number,
      percentage: number
    ) => {
      if (!user) return;

      // Create a unique key for this alert to prevent duplicates
      const alertKey = `${user.id}-${actionType}-${alertType}`;
      
      // Check if we've already sent this alert this session
      if (alertsSentThisSession.has(alertKey)) {
        console.log(`Rate limit alert already sent: ${alertKey}`);
        return;
      }

      try {
        const config = RATE_LIMIT_CONFIG[actionType];
        
        // Log to audit_logs table
        await logRateLimitAudit(alertType, actionType, currentCount, maxRequests, percentage);
        
        // Send email notification
        const { error } = await supabase.functions.invoke("security-alerts", {
          body: {
            event_type: alertType,
            details: {
              actor_email: user.email,
              action_type: actionType,
              current_count: currentCount,
              max_requests: maxRequests,
              percentage,
              window_minutes: config.windowMinutes,
              timestamp: new Date().toISOString(),
            },
          },
        });

        if (error) {
          console.error("Failed to send rate limit alert:", error);
        } else {
          // Mark this alert as sent
          alertsSentThisSession.add(alertKey);
          console.log(`Rate limit alert sent: ${alertKey}`);
        }
      } catch (err) {
        console.error("Error sending rate limit alert:", err);
      }
    },
    [user, logRateLimitAudit]
  );

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

        // Calculate percentage
        const percentage = (result.currentCount / result.maxRequests) * 100;

        // Send warning alert at 90% threshold (only once per session per action)
        const warningKey = `${user.id}-${actionType}`;
        if (percentage >= 90 && percentage < 100 && !warningsSent.current.has(warningKey)) {
          warningsSent.current.add(warningKey);
          sendRateLimitAlert(
            "rate_limit_warning",
            actionType,
            result.currentCount,
            result.maxRequests,
            percentage
          );
        }

        // Send exceeded alert when limit is reached
        if (!result.allowed) {
          const retryMinutes = Math.ceil((result.retryAfterSeconds || 0) / 60);
          toast({
            title: "Rate Limit Exceeded",
            description: `Too many ${actionType.replace(/_/g, " ")} attempts. Please try again in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}.`,
            variant: "destructive",
          });

          // Send exceeded alert
          sendRateLimitAlert(
            "rate_limit_exceeded",
            actionType,
            result.currentCount,
            result.maxRequests,
            100
          );
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
    [user, toast, sendRateLimitAlert]
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
