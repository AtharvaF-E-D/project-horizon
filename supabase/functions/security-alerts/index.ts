import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlertRequest {
  event_type: "role_changed" | "role_assigned" | "role_removed" | "data_exported" | "data_imported" | "suspicious_login";
  details: {
    actor_email?: string;
    target_email?: string;
    old_role?: string;
    new_role?: string;
    entity_type?: string;
    record_count?: number;
    file_name?: string;
    ip_address?: string;
    timestamp?: string;
  };
}

const getEmailSubject = (eventType: string): string => {
  const subjects: Record<string, string> = {
    role_changed: "🔐 Security Alert: User Role Changed",
    role_assigned: "🔐 Security Alert: New Role Assigned",
    role_removed: "🔐 Security Alert: Role Removed",
    data_exported: "📤 Security Alert: Data Export Detected",
    data_imported: "📥 Security Alert: Data Import Detected",
    suspicious_login: "⚠️ Security Alert: Suspicious Login Attempt",
  };
  return subjects[eventType] || "🔐 Security Alert";
};

const getEmailContent = (eventType: string, details: SecurityAlertRequest["details"]): string => {
  const timestamp = details.timestamp || new Date().toISOString();
  
  let content = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Security Alert</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
  `;

  switch (eventType) {
    case "role_changed":
      content += `
        <h2 style="color: #1e293b; margin-top: 0;">User Role Changed</h2>
        <p style="color: #475569;">A user's role has been modified in your system.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Changed By</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.actor_email || "Unknown"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Target User</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.target_email || "Unknown"}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Previous Role</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px;">${details.old_role || "None"}</span></td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">New Role</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px;">${details.new_role || "None"}</span></td>
          </tr>
        </table>
      `;
      break;

    case "role_assigned":
      content += `
        <h2 style="color: #1e293b; margin-top: 0;">New Role Assigned</h2>
        <p style="color: #475569;">A new role has been assigned to a user.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Assigned By</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.actor_email || "Unknown"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Target User</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.target_email || "Unknown"}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Role</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px;">${details.new_role || "Unknown"}</span></td>
          </tr>
        </table>
      `;
      break;

    case "role_removed":
      content += `
        <h2 style="color: #1e293b; margin-top: 0;">Role Removed</h2>
        <p style="color: #475569;">A role has been removed from a user.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Removed By</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.actor_email || "Unknown"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Target User</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.target_email || "Unknown"}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Removed Role</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><span style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px;">${details.old_role || "Unknown"}</span></td>
          </tr>
        </table>
      `;
      break;

    case "data_exported":
      content += `
        <h2 style="color: #1e293b; margin-top: 0;">Data Export Detected</h2>
        <p style="color: #475569;">A data export operation was performed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Exported By</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.actor_email || "Unknown"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Data Type</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.entity_type || "Unknown"}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Records Count</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.record_count || 0}</td>
          </tr>
        </table>
      `;
      break;

    case "data_imported":
      content += `
        <h2 style="color: #1e293b; margin-top: 0;">Data Import Detected</h2>
        <p style="color: #475569;">A data import operation was performed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Imported By</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.actor_email || "Unknown"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Data Type</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.entity_type || "Unknown"}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Records Count</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.record_count || 0}</td>
          </tr>
          ${details.file_name ? `
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">File Name</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${details.file_name}</td>
          </tr>
          ` : ""}
        </table>
      `;
      break;

    default:
      content += `
        <h2 style="color: #1e293b; margin-top: 0;">Security Event</h2>
        <p style="color: #475569;">A security-related event has occurred.</p>
        <pre style="background: #f1f5f9; padding: 16px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(details, null, 2)}</pre>
      `;
  }

  content += `
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          Event Time: ${new Date(timestamp).toLocaleString()}<br>
          This is an automated security notification. Please review if this action was authorized.
        </p>
      </div>
    </div>
  `;

  return content;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Security alerts function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event_type, details }: SecurityAlertRequest = await req.json();
    console.log("Processing security alert:", event_type, details);

    // Get all admin and owner users to notify
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "owner"]);

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found to notify");
      return new Response(
        JSON.stringify({ message: "No admin users to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userIds = adminRoles.map((r) => r.user_id);

    // Get admin emails from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const adminEmails = profiles?.map((p) => p.email).filter(Boolean) || [];
    console.log("Sending notifications to:", adminEmails);

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ message: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subject = getEmailSubject(event_type);
    const html = getEmailContent(event_type, details);

    // Send email to all admins
    const emailResponse = await resend.emails.send({
      from: "Security Alerts <onboarding@resend.dev>",
      to: adminEmails,
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Also create in-app notifications for admins
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title: subject.replace(/[🔐📤📥⚠️]\s*/g, ""),
      message: `${event_type.replace(/_/g, " ")} event detected. Check audit logs for details.`,
      type: "security",
      action_url: "/audit-logs",
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Error creating notifications:", notifError);
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent: adminEmails.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in security-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
