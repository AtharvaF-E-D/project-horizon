import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ActivityType = 
  | 'lead_created' | 'lead_updated' | 'lead_status_changed' | 'lead_converted'
  | 'deal_created' | 'deal_updated' | 'deal_stage_changed' | 'deal_won' | 'deal_lost'
  | 'task_created' | 'task_completed' | 'task_updated'
  | 'contact_created' | 'contact_updated'
  | 'company_created' | 'company_updated'
  | 'note_added' | 'email_sent' | 'call_made' | 'meeting_scheduled';

interface LogActivityParams {
  activityType: ActivityType;
  title: string;
  description?: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

export const useActivityLogger = () => {
  const { user } = useAuth();

  const logActivity = async ({
    activityType,
    title,
    description,
    entityType,
    entityId,
    entityName,
    metadata = {},
  }: LogActivityParams) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("activities").insert({
        user_id: user.id,
        activity_type: activityType,
        title,
        description,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        metadata,
      } as any);

      if (error) {
        console.error("Failed to log activity:", error);
      }
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  return { logActivity };
};