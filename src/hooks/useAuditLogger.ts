import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AuditAction =
  | "role_assigned"
  | "role_changed"
  | "role_removed"
  | "data_exported"
  | "data_imported"
  | "login_success"
  | "login_failed"
  | "logout"
  | "settings_changed"
  | "team_invite_created"
  | "team_invite_accepted"
  | "team_invite_deleted"
  | "profile_updated"
  | "password_changed";

export type AuditEntityType =
  | "user_role"
  | "export"
  | "import"
  | "auth"
  | "settings"
  | "team_invite"
  | "profile";

interface AuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  details?: Record<string, string | number | boolean | string[] | null | undefined>;
}

export const useAuditLogger = () => {
  const { user } = useAuth();

  const logAuditEvent = useCallback(
    async ({ action, entityType, entityId, details = {} }: AuditLogParams) => {
      if (!user) {
        console.warn("Cannot log audit event: no authenticated user");
        return;
      }

      try {
        // Get user email from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .single();

        const insertData = {
          user_id: user.id,
          user_email: profile?.email || user.email,
          action,
          entity_type: entityType,
          entity_id: entityId || null,
          details: JSON.parse(JSON.stringify(details)),
          user_agent: navigator.userAgent,
        };

        const { error } = await supabase.from("audit_logs").insert([insertData]);

        if (error) {
          console.error("Failed to log audit event:", error);
        }
      } catch (err) {
        console.error("Error logging audit event:", err);
      }
    },
    [user]
  );

  const logDataExport = useCallback(
    async (entityType: string, recordCount: number, fields?: string[]) => {
      await logAuditEvent({
        action: "data_exported",
        entityType: "export",
        entityId: entityType,
        details: {
          exported_entity: entityType,
          record_count: recordCount,
          fields: fields || [],
          timestamp: new Date().toISOString(),
        },
      });
    },
    [logAuditEvent]
  );

  const logDataImport = useCallback(
    async (
      entityType: string,
      successCount: number,
      errorCount: number,
      fileName?: string
    ) => {
      await logAuditEvent({
        action: "data_imported",
        entityType: "import",
        entityId: entityType,
        details: {
          imported_entity: entityType,
          success_count: successCount,
          error_count: errorCount,
          file_name: fileName,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [logAuditEvent]
  );

  const logSettingsChange = useCallback(
    async (settingName: string, oldValue: string, newValue: string) => {
      await logAuditEvent({
        action: "settings_changed",
        entityType: "settings",
        entityId: settingName,
        details: {
          setting: settingName,
          old_value: oldValue,
          new_value: newValue,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [logAuditEvent]
  );

  const logTeamInvite = useCallback(
    async (
      action: "team_invite_created" | "team_invite_accepted" | "team_invite_deleted",
      inviteEmail: string,
      role?: string
    ) => {
      await logAuditEvent({
        action,
        entityType: "team_invite",
        entityId: inviteEmail,
        details: {
          invited_email: inviteEmail,
          role: role,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [logAuditEvent]
  );

  return {
    logAuditEvent,
    logDataExport,
    logDataImport,
    logSettingsChange,
    logTeamInvite,
  };
};
