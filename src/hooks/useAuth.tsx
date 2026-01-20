import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSuspensionStatus = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("suspended_until, suspension_reason")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.suspended_until) {
      const suspendedUntil = new Date(profile.suspended_until);
      const now = new Date();

      if (suspendedUntil > now) {
        const isPermanent = suspendedUntil.getFullYear() > 2099;
        const timeRemaining = isPermanent
          ? "permanently"
          : `until ${suspendedUntil.toLocaleString()}`;

        await supabase.auth.signOut();
        
        toast({
          title: "Account Suspended",
          description: `Your account has been suspended ${timeRemaining}. ${profile.suspension_reason ? `Reason: ${profile.suspension_reason}` : ""}`,
          variant: "destructive",
        });
        
        navigate("/auth");
        return true;
      }
    }
    return false;
  }, [navigate, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Check suspension on sign in
      if (event === "SIGNED_IN" && session?.user) {
        setTimeout(() => {
          checkSuspensionStatus(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkSuspensionStatus]);

  // Periodic suspension check every 30 seconds while logged in
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      checkSuspensionStatus(user.id);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [user, checkSuspensionStatus]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return { user, session, loading, signOut };
};