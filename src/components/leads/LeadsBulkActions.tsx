import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, RefreshCw, Download, X } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface LeadsBulkActionsProps {
  selectedIds: string[];
  leads: Tables<"leads">[];
  onClearSelection: () => void;
}

export const LeadsBulkActions = ({ selectedIds, leads, onClearSelection }: LeadsBulkActionsProps) => {
  const queryClient = useQueryClient();
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onClearSelection();
      toast.success(`${selectedIds.length} lead(s) deleted`);
    },
    onError: () => toast.error("Failed to delete leads"),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("leads")
        .update({ status: status as any })
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onClearSelection();
      setBulkStatus("");
      toast.success(`${selectedIds.length} lead(s) updated`);
    },
    onError: () => toast.error("Failed to update leads"),
  });

  const handleExport = () => {
    const selected = leads.filter((l) => selectedIds.includes(l.id));
    const headers = ["First Name", "Last Name", "Email", "Phone", "Company", "Status", "Source", "Score"];
    const rows = selected.map((l) => [
      l.first_name,
      l.last_name,
      l.email || "",
      l.phone || "",
      l.company || "",
      l.status || "",
      l.source || "",
      String(l.score || 0),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selected.length} lead(s) exported`);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 ml-32 z-50 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedIds.length} selected
      </span>

      <div className="flex items-center gap-2">
        <Select value={bulkStatus} onValueChange={(v) => { setBulkStatus(v); bulkStatusMutation.mutate(v); }}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="unqualified">Unqualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="w-4 h-4" />
          Export
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedIds.length} lead(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected leads will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => bulkDeleteMutation.mutate()}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="ghost" size="icon" onClick={onClearSelection} className="h-9 w-9">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
