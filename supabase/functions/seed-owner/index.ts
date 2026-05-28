// Seed the super admin (Owner) account from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD secrets.
// Safe to call repeatedly: idempotent. Requires a one-time bootstrap token (the password itself)
// to prevent unauthenticated abuse before any Owner exists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bootstrap-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const email = Deno.env.get("SUPER_ADMIN_EMAIL");
    const password = Deno.env.get("SUPER_ADMIN_PASSWORD");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Bootstrap guard: if an owner already exists, require a caller who is an owner
    // OR a matching X-Bootstrap-Token header equal to SUPER_ADMIN_PASSWORD.
    const { data: existingOwners } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "owner")
      .limit(1);

    if (existingOwners && existingOwners.length > 0) {
      const token = req.headers.get("x-bootstrap-token");
      const authHeader = req.headers.get("authorization");
      let authorized = token === password;
      if (!authorized && authHeader) {
        const jwt = authHeader.replace("Bearer ", "");
        const { data: userData } = await admin.auth.getUser(jwt);
        if (userData?.user) {
          const { data: roles } = await admin
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id)
            .eq("role", "owner")
            .maybeSingle();
          authorized = !!roles;
        }
      }
      if (!authorized) {
        return new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Find or create the user
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers();
    const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (found) {
      userId = found.id;
      // Ensure password & confirmation are current
      await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Super Admin" },
      });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    // Ensure profile exists & active
    await admin.from("profiles").upsert({
      id: userId,
      email,
      full_name: "Super Admin",
      is_active: true,
      suspended_until: null,
    });

    // Ensure owner role (and drop any lower roles assigned by the signup trigger)
    await admin.from("user_roles").delete().eq("user_id", userId).neq("role", "owner");
    await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "owner" }, { onConflict: "user_id,role" });

    return new Response(
      JSON.stringify({ ok: true, user_id: userId, email, created: !found }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("seed-owner error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
