import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.99.3/cors";

// This edge function returns TwiML instructions for Twilio voice calls.
// It's called by Twilio when a call is connected.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const to = url.searchParams.get("to");

  // Status callback - just acknowledge
  if (action === "status") {
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!to) {
    // Return TwiML that says there was an error
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, no destination number was provided. Goodbye.</Say>
  <Hangup/>
</Response>`;
    return new Response(twiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }

  // Return TwiML that connects the agent to the customer
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you now. Please hold.</Say>
  <Dial callerId="${to}">
    <Number>${to}</Number>
  </Dial>
</Response>`;

  return new Response(twiml, {
    headers: { ...corsHeaders, "Content-Type": "text/xml" },
  });
});
