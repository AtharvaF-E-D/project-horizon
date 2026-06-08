import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/** Keeps the current user's `agent_presence` row marked online with periodic heartbeat. */
export const useAgentPresence = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const upsert = (status: "online" | "offline" | "away") => {
      supabase.from("agent_presence").upsert({
        user_id: user.id,
        status,
        last_seen: new Date().toISOString(),
      }).then(() => {});
    };

    upsert("online");
    const heartbeat = setInterval(() => upsert("online"), 30_000);
    const handleVisibility = () => upsert(document.visibilityState === "visible" ? "online" : "away");
    document.addEventListener("visibilitychange", handleVisibility);
    const handleUnload = () => upsert("offline");
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      upsert("offline");
    };
  }, [user]);
};
