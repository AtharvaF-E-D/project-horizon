import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface WorkflowNode {
  id: string;
  type: string;
  data: { label?: string; action?: string; config?: Record<string, unknown> };
}
interface WorkflowEdge {
  source: string;
  target: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { workflowId, triggerData = {} } = body;

    if (!workflowId) {
      return new Response(JSON.stringify({ error: "workflowId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: wf, error: wfErr } = await supabase
      .from("automation_workflows").select("*").eq("id", workflowId).single();
    if (wfErr || !wf) {
      return new Response(JSON.stringify({ error: "Workflow not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: run } = await supabase.from("workflow_runs").insert({
      workflow_id: workflowId, user_id: userId, status: "running", trigger_data: triggerData,
    }).select().single();

    const logs: Array<{ ts: string; node: string; message: string; ok: boolean }> = [];
    const nodes = (wf.nodes as WorkflowNode[]) || [];
    const edges = (wf.edges as WorkflowEdge[]) || [];

    // Walk graph from trigger node(s)
    const adjacency = new Map<string, string[]>();
    edges.forEach((e) => {
      const arr = adjacency.get(e.source) || [];
      arr.push(e.target);
      adjacency.set(e.source, arr);
    });

    const startNodes = nodes.filter((n) => n.type === "trigger" || !edges.some((e) => e.target === n.id));
    const queue = [...startNodes.map((n) => n.id)];
    const visited = new Set<string>();

    while (queue.length) {
      const nid = queue.shift()!;
      if (visited.has(nid)) continue;
      visited.add(nid);
      const node = nodes.find((n) => n.id === nid);
      if (!node) continue;

      try {
        await executeAction(node, supabase, userId, triggerData);
        logs.push({ ts: new Date().toISOString(), node: node.data.label || nid, message: `Executed ${node.data.action || node.type}`, ok: true });
      } catch (e) {
        logs.push({ ts: new Date().toISOString(), node: node.data.label || nid, message: String(e), ok: false });
      }

      (adjacency.get(nid) || []).forEach((t) => queue.push(t));
    }

    await supabase.from("workflow_runs").update({
      status: "completed", logs, completed_at: new Date().toISOString(),
    }).eq("id", run!.id);

    return new Response(JSON.stringify({ runId: run!.id, logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function executeAction(node: WorkflowNode, supabase: any, userId: string, triggerData: any) {
  const action = node.data.action;
  const config = node.data.config || {};
  switch (action) {
    case "create_task": {
      await supabase.from("tasks").insert({
        user_id: userId,
        title: String(config.title || "Workflow task"),
        description: String(config.description || ""),
        priority: String(config.priority || "medium"),
        status: "todo",
      });
      return;
    }
    case "create_notification": {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: String(config.title || "Workflow notification"),
        message: String(config.message || ""),
        type: "info",
      });
      return;
    }
    case "log_activity": {
      await supabase.from("activities").insert({
        user_id: userId,
        action: String(config.action || "workflow_run"),
        entity_type: "workflow",
        details: { trigger: triggerData, node: node.id },
      });
      return;
    }
    case "delay": {
      await new Promise((r) => setTimeout(r, Math.min(Number(config.ms || 100), 2000)));
      return;
    }
    default:
      return;
  }
}
