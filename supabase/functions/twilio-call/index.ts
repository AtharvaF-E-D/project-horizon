import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.3";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.99.3/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "list-numbers") {
      // List available Twilio phone numbers
      const response = await fetch(`${GATEWAY_URL}/IncomingPhoneNumbers.json`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TWILIO_API_KEY,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Twilio API error [${response.status}]: ${JSON.stringify(data)}`);
      }

      const numbers = (data.incoming_phone_numbers || []).map((n: any) => ({
        sid: n.sid,
        phoneNumber: n.phone_number,
        friendlyName: n.friendly_name,
      }));

      return new Response(JSON.stringify({ numbers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "make-call") {
      const { to, from, agentPhone } = body;

      if (!to || !from || !agentPhone) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: to, from, agentPhone" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate phone number format (basic E.164)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to) || !phoneRegex.test(from) || !phoneRegex.test(agentPhone)) {
        return new Response(
          JSON.stringify({ error: "Phone numbers must be in E.164 format (e.g. +15551234567)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 1: Call the agent's phone first
      // When agent picks up, Twilio will connect them to the customer
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const twimlUrl = `${supabaseUrl}/functions/v1/twilio-twiml?to=${encodeURIComponent(to)}`;

      const response = await fetch(`${GATEWAY_URL}/Calls.json`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TWILIO_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: agentPhone,
          From: from,
          Url: twimlUrl,
          StatusCallback: `${supabaseUrl}/functions/v1/twilio-twiml?action=status&to=${encodeURIComponent(to)}`,
          StatusCallbackMethod: "POST",
          StatusCallbackEvent: "completed",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Twilio API error [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(
        JSON.stringify({ success: true, callSid: data.sid, status: data.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in twilio-call:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
