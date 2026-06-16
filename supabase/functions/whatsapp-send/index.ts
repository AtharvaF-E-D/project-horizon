// Send a WhatsApp message via Meta Cloud API (Graph v21).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return json({ error: "WhatsApp credentials not configured" }, 500);
  }

  // Auth: require a logged-in user
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData?.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const { conversation_id, text, file_url, file_name, file_type, template } = body ?? {};
  if (!conversation_id) return json({ error: "conversation_id required" }, 400);
  if (!text && !file_url && !template) return json({ error: "empty message" }, 400);

  const { data: convo, error: cErr } = await admin
    .from("whatsapp_conversations")
    .select("*")
    .eq("id", conversation_id)
    .maybeSingle();
  if (cErr || !convo) return json({ error: "conversation not found" }, 404);
  if (convo.user_id !== user.id) {
    // allow admins/owners
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = (role ?? []).some((r: any) => ["owner", "admin"].includes(r.role));
    if (!isAdmin) return json({ error: "forbidden" }, 403);
  }

  const toRaw = (convo.contact_phone ?? "").toString().replace(/[^\d]/g, "");
  if (!toRaw) return json({ error: "contact has no phone" }, 400);

  // Build Meta payload
  let metaBody: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toRaw,
  };
  if (template?.name) {
    metaBody.type = "template";
    metaBody.template = {
      name: template.name,
      language: { code: template.language ?? "en_US" },
      ...(template.components ? { components: template.components } : {}),
    };
  } else if (file_url && file_type?.startsWith("image/")) {
    metaBody.type = "image";
    metaBody.image = { link: file_url, ...(text ? { caption: text } : {}) };
  } else if (file_url) {
    metaBody.type = "document";
    metaBody.document = { link: file_url, filename: file_name ?? "file", ...(text ? { caption: text } : {}) };
  } else {
    metaBody.type = "text";
    metaBody.text = { preview_url: false, body: text };
  }

  const resp = await fetch(
    `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metaBody),
    },
  );
  const respText = await resp.text();
  let respJson: any = {};
  try { respJson = JSON.parse(respText); } catch { /* leave empty */ }

  if (!resp.ok) {
    console.error("meta send failed", resp.status, respText);
    return json({ error: "meta_api_error", status: resp.status, details: respJson }, 502);
  }

  const waMessageId: string | null = respJson?.messages?.[0]?.id ?? null;
  const displayText = text || (file_name ? `📎 ${file_name}` : "(media)");

  const { data: inserted, error: insErr } = await admin
    .from("whatsapp_messages")
    .insert({
      conversation_id: convo.id,
      user_id: convo.user_id,
      sender: "me",
      text: displayText,
      status: "sent",
      wa_message_id: waMessageId,
      file_url: file_url ?? null,
      file_name: file_name ?? null,
      file_type: file_type ?? null,
    })
    .select()
    .single();

  if (insErr) {
    console.error("insert failed", insErr);
    return json({ error: "db_insert_failed", details: insErr.message }, 500);
  }

  await admin
    .from("whatsapp_conversations")
    .update({ last_message: displayText, last_message_at: new Date().toISOString() })
    .eq("id", convo.id);

  return json({ ok: true, message: inserted, wa_message_id: waMessageId });
});
