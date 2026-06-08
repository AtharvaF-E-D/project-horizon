import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState,
  type Connection, type Edge, type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Play, Plus, Save, Trash2, Zap } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  nodes: Node[];
  edges: Edge[];
  enabled: boolean;
}

const ACTION_OPTIONS = [
  { value: "create_task", label: "Create Task" },
  { value: "create_notification", label: "Send Notification" },
  { value: "log_activity", label: "Log Activity" },
  { value: "delay", label: "Delay" },
];

const initialNodes: Node[] = [
  { id: "trigger-1", type: "input", position: { x: 50, y: 100 }, data: { label: "Trigger: Manual", action: "trigger" } },
];

const Automations = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("New Workflow");
  const [enabled, setEnabled] = useState(false);
  const [triggerType, setTriggerType] = useState("manual");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const loadWorkflows = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("automation_workflows").select("*").order("created_at", { ascending: false });
    setWorkflows((data as any) || []);
  }, [user]);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const loadWorkflow = (wf: Workflow) => {
    setSelectedId(wf.id);
    setName(wf.name);
    setEnabled(wf.enabled);
    setTriggerType(wf.trigger_type);
    setNodes(wf.nodes?.length ? wf.nodes : initialNodes);
    setEdges(wf.edges || []);
  };

  const onConnect = useCallback((c: Connection) => setEdges((e) => addEdge(c, e)), [setEdges]);

  const addActionNode = () => {
    const id = `node-${Date.now()}`;
    setNodes((nds) => [...nds, {
      id, position: { x: 250 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { label: "Create Task", action: "create_task", config: { title: "New task from workflow" } },
    }]);
  };

  const updateSelectedNode = (action: string) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => n.id === selectedNodeId
      ? { ...n, data: { ...n.data, action, label: ACTION_OPTIONS.find(o => o.value === action)?.label || action } }
      : n));
  };

  const saveWorkflow = async () => {
    if (!user) return;
    const payload = {
      user_id: user.id, name, enabled, trigger_type: triggerType,
      nodes: nodes as any, edges: edges as any,
    };
    if (selectedId) {
      await supabase.from("automation_workflows").update(payload).eq("id", selectedId);
    } else {
      const { data } = await supabase.from("automation_workflows").insert(payload).select().single();
      if (data) setSelectedId(data.id);
    }
    toast({ title: "Workflow saved" });
    loadWorkflows();
  };

  const runWorkflow = async () => {
    if (!selectedId) { toast({ title: "Save the workflow first", variant: "destructive" }); return; }
    const { data, error } = await supabase.functions.invoke("workflow-executor", {
      body: { workflowId: selectedId, triggerData: { source: "manual" } },
    });
    if (error) { toast({ title: "Run failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Workflow executed", description: `${(data as any)?.logs?.length || 0} steps` });
  };

  const deleteWorkflow = async () => {
    if (!selectedId) return;
    await supabase.from("automation_workflows").delete().eq("id", selectedId);
    setSelectedId(null); setName("New Workflow"); setNodes(initialNodes); setEdges([]);
    loadWorkflows();
  };

  const newWorkflow = () => {
    setSelectedId(null); setName("New Workflow"); setEnabled(false);
    setTriggerType("manual"); setNodes(initialNodes); setEdges([]);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Zap className="w-7 h-7 text-primary" /> Automations</h1>
            <p className="text-muted-foreground">Visual workflow builder — drag, connect, automate.</p>
          </div>
          <Button onClick={newWorkflow}><Plus className="w-4 h-4 mr-1" /> New</Button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-3">
            <CardHeader><CardTitle className="text-sm">Workflows</CardTitle></CardHeader>
            <CardContent className="space-y-1 max-h-[500px] overflow-auto">
              {workflows.map((wf) => (
                <button key={wf.id} onClick={() => loadWorkflow(wf)}
                  className={`w-full text-left p-2 rounded text-sm hover:bg-accent ${selectedId === wf.id ? "bg-accent" : ""}`}>
                  <div className="flex justify-between items-center">
                    <span className="truncate">{wf.name}</span>
                    {wf.enabled && <Badge variant="secondary" className="text-xs">on</Badge>}
                  </div>
                </button>
              ))}
              {workflows.length === 0 && <p className="text-xs text-muted-foreground p-2">No workflows yet.</p>}
            </CardContent>
          </Card>

          <Card className="col-span-9">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="lead_created">Lead Created</SelectItem>
                    <SelectItem value="deal_won">Deal Won</SelectItem>
                    <SelectItem value="message_received">Message Received</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                  <Label htmlFor="enabled">Enabled</Label>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={addActionNode}><Plus className="w-4 h-4 mr-1" /> Action</Button>
                  <Button size="sm" variant="outline" onClick={saveWorkflow}><Save className="w-4 h-4 mr-1" /> Save</Button>
                  <Button size="sm" onClick={runWorkflow}><Play className="w-4 h-4 mr-1" /> Run</Button>
                  {selectedId && <Button size="sm" variant="destructive" onClick={deleteWorkflow}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ height: 500 }} className="border rounded">
                <ReactFlow
                  nodes={nodes} edges={edges}
                  onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(_, n) => setSelectedNodeId(n.id)}
                  fitView
                >
                  <Background /><Controls /><MiniMap />
                </ReactFlow>
              </div>
              {selectedNode && selectedNode.id !== "trigger-1" && (
                <div className="mt-4 p-3 border rounded space-y-2">
                  <Label>Action for: {selectedNode.data.label}</Label>
                  <Select value={(selectedNode.data as any).action} onValueChange={updateSelectedNode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Automations;
