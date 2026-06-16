// Meta WhatsApp Cloud API webhook receiver.
// GET = verification handshake. POST = inbound messages & status updates.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);

  // Verification handshake from Meta
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token && token === VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  try {
    const entries = payload?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const contactName = value?.contacts?.[0]?.profile?.name ?? null;

        // Status updates (sent / delivered / read / failed)
        for (const status of value.statuses ?? []) {
          const waId: string | undefined = status.id;
          const state: string = status.status; // sent | delivered | read | failed
          if (!waId) continue;
          await admin
            .from("whatsapp_messages")
            .update({ status: state === "failed" ? "failed" : state })
            .eq("wa_message_id", waId);
        }

        // Inbound messages
        for (const msg of value.messages ?? []) {
          const from: string = msg.from; // E.164 without +
          const waId: string = msg.id;
          let text = "";
          let fileUrl: string | null = null;
          let fileType: string | null = null;
          let fileName: string | null = null;

          if (msg.type === "text") {
            text = msg.text?.body ?? "";
          } else if (msg.type === "image" || msg.type === "video" || msg.type === "audio" || msg.type === "document") {
            const media = msg[msg.type];
            text = media?.caption || `📎 ${msg.type}`;
            fileType = media?.mime_type ?? msg.type;
            fileName = media?.filename ?? `${msg.type}-${waId}`;
            // We store the Meta media id; downloading requires the access token.
            fileUrl = media?.id ? `meta-media:${media.id}` : null;
          } else {
            text = `[${msg.type} message]`;
          }

          const phone = `+${from}`;
          // Find or create conversation. We can't know user_id from Meta — assign to the
          // first owner/admin so the message lands in a real inbox.
          let { data: convo } = await admin
            .from("whatsapp_conversations")
            .select("*")
            .eq("contact_phone", phone)
            .maybeSingle();

          if (!convo) {
            const { data: owner } = await admin
              .from("user_roles")
              .select("user_id")
              .in("role", ["owner", "admin"])
              .limit(1)
              .maybeSingle();
            const ownerId = owner?.user_id;
            if (!ownerId) {
              console.warn("no owner/admin user to assign inbound message");
              continue;
            }
            const initials = (contactName ?? phone)
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const ins = await admin
              .from("whatsapp_conversations")
              .insert({
                user_id: ownerId,
                contact_name: contactName ?? phone,
                contact_phone: phone,
                contact_avatar: initials,
                is_online: true,
                unread_count: 1,
              })
              .select()
              .single();
            convo = ins.data;
          }

          if (!convo) continue;

          await admin.from("whatsapp_messages").insert({
            conversation_id: convo.id,
            user_id: convo.user_id,
            sender: "them",
            text,
            status: "delivered",
            wa_message_id: waId,
            file_url: fileUrl,
            file_name: fileName,
            file_type: fileType,
          });

          await admin
            .from("whatsapp_conversations")
            .update({
              last_message: text,
              last_message_at: new Date().toISOString(),
              unread_count: (convo.unread_count ?? 0) + 1,
              contact_name: convo.contact_name || contactName || phone,
            })
            .eq("id", convo.id);
        }
      }
    }
  } catch (e) {
    console.error("webhook error", e);
    // Always 200 so Meta doesn't retry-storm on parser bugs.
  }

  return new Response("ok", { status: 200 });
});
