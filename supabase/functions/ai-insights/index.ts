import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | "score_lead"
  | "summarize_lead"
  | "next_action_lead"
  | "summarize_call"
  | "sentiment_call"
  | "suggest_replies"
  | "detect_intent"
  | "sales_coach"
  | "generate_campaign"
  | "prompt_assistant";

const SYSTEM = `You are SIMPLIFY AI, a sales intelligence engine for a CRM.
Always respond concisely. When a JSON tool is provided, use it.`;

async function callAI(messages: any[], tools?: any[], tool_choice?: any) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const body: any = {
    model: "google/gemini-2.5-flash",
    messages: [{ role: "system", content: SYSTEM }, ...messages],
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = tool_choice;
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits depleted. Add credits to continue.");
    throw new Error(`AI gateway error: ${res.status} ${t}`);
  }
  return await res.json();
}

function extractToolArgs(json: any) {
  const call = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return null;
  try { return JSON.parse(call.function.arguments); } catch { return null; }
}
function extractText(json: any): string {
  return json.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action, payload } = await req.json() as { action: Action; payload: any };

    let result: any = {};

    switch (action) {
      case "score_lead": {
        const tool = [{
          type: "function", function: {
            name: "score_lead",
            description: "Classify lead temperature based on signals.",
            parameters: {
              type: "object", properties: {
                label: { type: "string", enum: ["Hot", "Warm", "Cold"] },
                score: { type: "number", description: "0-100 numeric score" },
                reason: { type: "string" },
              },
              required: ["label", "score", "reason"], additionalProperties: false,
            },
          },
        }];
        const json = await callAI(
          [{ role: "user", content: `Score this lead.\n\n${JSON.stringify(payload)}` }],
          tool,
          { type: "function", function: { name: "score_lead" } }
        );
        result = extractToolArgs(json) || { label: "Cold", score: 0, reason: "n/a" };
        break;
      }
      case "summarize_lead": {
        const json = await callAI([{ role: "user", content: `Write a 1-2 sentence sales summary for this lead. Focus on intent and stage.\n\n${JSON.stringify(payload)}` }]);
        result = { summary: extractText(json).trim() };
        break;
      }
      case "next_action_lead": {
        const json = await callAI([{ role: "user", content: `Suggest the single best next action for this lead in one short sentence (action verb first).\n\n${JSON.stringify(payload)}` }]);
        result = { next_action: extractText(json).trim() };
        break;
      }
      case "summarize_call": {
        const json = await callAI([{ role: "user", content: `Summarize this sales call in 2-3 bullet points.\n\n${JSON.stringify(payload)}` }]);
        result = { summary: extractText(json).trim() };
        break;
      }
      case "sentiment_call": {
        const tool = [{
          type: "function", function: {
            name: "sentiment", parameters: {
              type: "object", properties: {
                sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                confidence: { type: "number" },
              }, required: ["sentiment", "confidence"], additionalProperties: false,
            },
          },
        }];
        const json = await callAI([{ role: "user", content: `Analyze sentiment of this call.\n\n${JSON.stringify(payload)}` }], tool, { type: "function", function: { name: "sentiment" } });
        result = extractToolArgs(json) || { sentiment: "neutral", confidence: 0.5 };
        break;
      }
      case "suggest_replies": {
        const tool = [{
          type: "function", function: {
            name: "suggest_replies", parameters: {
              type: "object", properties: {
                replies: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
              }, required: ["replies"], additionalProperties: false,
            },
          },
        }];
        const json = await callAI([{ role: "user", content: `Given this WhatsApp conversation, propose 3 short professional reply options (max 18 words each).\n\n${JSON.stringify(payload)}` }], tool, { type: "function", function: { name: "suggest_replies" } });
        result = extractToolArgs(json) || { replies: [] };
        break;
      }
      case "detect_intent": {
        const tool = [{
          type: "function", function: {
            name: "intent", parameters: {
              type: "object", properties: {
                intent: { type: "string", enum: ["pricing_inquiry", "support_issue", "appointment_booking", "complaint", "general", "purchase_intent"] },
              }, required: ["intent"], additionalProperties: false,
            },
          },
        }];
        const json = await callAI([{ role: "user", content: `Detect intent of this message.\n\n${payload?.text || ""}` }], tool, { type: "function", function: { name: "intent" } });
        result = extractToolArgs(json) || { intent: "general" };
        break;
      }
      case "sales_coach": {
        const json = await callAI([{ role: "user", content: `Act as a sales coach. Given these call notes, give feedback on tone, confidence, objection handling, and closing in 4 short bullets.\n\n${JSON.stringify(payload)}` }]);
        result = { feedback: extractText(json).trim() };
        break;
      }
      case "generate_campaign": {
        const tool = [{
          type: "function", function: {
            name: "campaign", parameters: {
              type: "object", properties: {
                subject: { type: "string" },
                body: { type: "string" },
              }, required: ["subject", "body"], additionalProperties: false,
            },
          },
        }];
        const json = await callAI([{ role: "user", content: `Write a marketing email campaign. Brief: ${payload?.brief || ""}. Audience: ${payload?.audience || "general subscribers"}. Keep body under 150 words.` }], tool, { type: "function", function: { name: "campaign" } });
        result = extractToolArgs(json) || { subject: "", body: "" };
        break;
      }
      case "prompt_assistant": {
        const json = await callAI([{ role: "user", content: payload?.prompt || "" }]);
        result = { text: extractText(json).trim() };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
