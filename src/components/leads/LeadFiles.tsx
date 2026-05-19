import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Trash2, Loader2 } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);

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

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 25 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const path = `${userId}/${leadId}/${Date.now()}_${file.name}`;
    const up = await supabase.storage.from("lead-files").upload(path, file, { contentType: file.type });
    if (up.error) {
      toast({ title: "Upload failed", description: up.error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { error } = await supabase.from("lead_files" as any).insert({
      lead_id: leadId,
      user_id: userId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      mime_type: file.type,
    });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "File uploaded" });
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    load();
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

  return (
    <div className="space-y-3">
      <input ref={fileInput} type="file" hidden onChange={onUpload} />
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {uploading ? "Uploading..." : "Upload file"}
      </Button>

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
