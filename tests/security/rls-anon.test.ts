/**
 * Automated security checks: ensure anonymous (unauthenticated) clients
 * cannot read or write critical tables, and cannot subscribe to realtime
 * changes. Run with `bunx vitest run tests/security`.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CRITICAL_TABLES = [
  "profiles",
  "user_roles",
  "audit_logs",
  "suspension_history",
  "contacts",
  "leads",
  "deals",
  "companies",
  "calls",
  "whatsapp_conversations",
  "whatsapp_messages",
  "subscribers",
  "campaigns",
  "team_invites",
  "rate_limits",
] as const;

describe("RLS: anonymous client cannot read critical tables", () => {
  for (const table of CRITICAL_TABLES) {
    it(`${table}: SELECT returns no rows for anon`, async () => {
      const { data, error } = await anon.from(table as any).select("*").limit(1);
      // Either RLS blocks (error) or returns empty array — never a row.
      if (error) {
        expect(error).toBeTruthy();
      } else {
        expect(data ?? []).toHaveLength(0);
      }
    });
  }
});

describe("RLS: anonymous client cannot insert into critical tables", () => {
  for (const table of CRITICAL_TABLES) {
    it(`${table}: INSERT is rejected for anon`, async () => {
      const { error } = await anon.from(table as any).insert({} as any);
      expect(error).toBeTruthy();
    });
  }
});

describe("SECURITY DEFINER functions are not callable by anon", () => {
  it("has_role rejects anon", async () => {
    const { error } = await anon.rpc("has_role" as any, {
      _user_id: "00000000-0000-0000-0000-000000000000",
      _role: "admin",
    });
    expect(error).toBeTruthy();
  });

  it("check_rate_limit rejects anon", async () => {
    const { error } = await anon.rpc("check_rate_limit" as any, {
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_action_type: "test",
      p_max_requests: 1,
      p_window_minutes: 1,
    });
    expect(error).toBeTruthy();
  });

  it("is_user_suspended rejects anon", async () => {
    const { error } = await anon.rpc("is_user_suspended" as any, {
      p_user_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).toBeTruthy();
  });
});

describe("Realtime: anon postgres_changes receives no data", () => {
  it("anon subscription to whatsapp_messages yields no payloads", async () => {
    const received: unknown[] = [];
    const channel = anon
      .channel("test-anon-wa")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_messages" },
        (payload) => received.push(payload)
      )
      .subscribe();

    await new Promise((r) => setTimeout(r, 1500));
    await anon.removeChannel(channel);
    expect(received).toHaveLength(0);
  }, 10000);
});
