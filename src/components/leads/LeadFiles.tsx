import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Trash2, Loader2, X } from "lucide-react";
import { format } from "date-fns";

interface Props {
  leadId: string;
  userId: string;
}

interface FileRow {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  status: "uploading" | "saving" | "done" | "error";
  progress: number;
  error?: string;
}

const prettySize = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const LeadFiles = ({ leadId, userId }: Props) => {
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lead_files" as any)
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load files", description: error.message, variant: "destructive" });
    setFiles((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const processUpload = async (item: UploadQueueItem) => {
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 10 } : q))
    );

    if (item.file.size > 25 * 1024 * 1024) {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "error", progress: 0, error: "Max 25 MB" } : q
        )
      );
      return;
    }

    const path = `${userId}/${leadId}/${Date.now()}_${item.file.name}`;

    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, progress: 40 } : q))
    );

    const up = await supabase.storage
      .from("lead-files")
      .upload(path, item.file, { contentType: item.file.type });

    if (up.error) {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "error", progress: 0, error: up.error!.message } : q
        )
      );
      return;
    }

    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: "saving", progress: 80 } : q))
    );

    const { error } = await supabase.from("lead_files" as any).insert({
      lead_id: leadId,
      user_id: userId,
      file_name: item.file.name,
      file_path: path,
      file_size: item.file.size,
      mime_type: item.file.type,
    });

    if (error) {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "error", progress: 0, error: error.message } : q
        )
      );
      return;
    }

    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: "done", progress: 100 } : q))
    );
    load();
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const newItems: UploadQueueItem[] = selected.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      status: "uploading",
      progress: 0,
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);

    if (fileInput.current) fileInput.current.value = "";

    for (const item of newItems) {
      await processUpload(item);
    }

    setTimeout(() => {
      setUploadQueue((prev) => prev.filter((q) => q.status !== "done"));
    }, 3000);
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const download = async (f: FileRow) => {
    const { data, error } = await supabase.storage.from("lead-files").createSignedUrl(f.file_path, 60);
    if (error || !data) {
      toast({ title: "Download failed", description: error?.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (f: FileRow) => {
    if (!confirm(`Delete ${f.file_name}?`)) return;
    await supabase.storage.from("lead-files").remove([f.file_path]);
    await supabase.from("lead_files" as any).delete().eq("id", f.id);
    toast({ title: "File deleted" });
    load();
  };

  const isBusy = uploadQueue.some((q) => q.status === "uploading" || q.status === "saving");

  return (
    <div className="space-y-3">
      <input ref={fileInput} type="file" hidden multiple onChange={onUpload} />
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => fileInput.current?.click()}
        disabled={isBusy}
      >
        {isBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {isBusy ? "Uploading..." : "Upload files"}
      </Button>

      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          {uploadQueue.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {prettySize(item.file.size)} · {item.status === "error" ? (
                    <span className="text-destructive">{item.error}</span>
                  ) : item.status === "done" ? (
                    <span className="text-green-600">Done</span>
                  ) : (
                    <span className="capitalize">{item.status}</span>
                  )}
                </div>
                <Progress value={item.progress} className="h-1.5 mt-1" />
              </div>
              {(item.status === "error" || item.status === "done") && (
                <Button size="icon" variant="ghost" onClick={() => removeFromQueue(item.id)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : files.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No files attached yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg border">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {prettySize(f.file_size)} · {format(new Date(f.created_at), "MMM d, yyyy")}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => download(f)}>
                <Download className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(f)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
