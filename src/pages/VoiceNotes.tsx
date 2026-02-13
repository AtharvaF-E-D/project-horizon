import { useState } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Play, Pause, Trash2, Search, Clock, FileAudio, Download, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceNote {
  id: string;
  title: string;
  duration: string;
  createdAt: string;
  tags: string[];
  linkedTo?: { type: string; name: string };
  transcript?: string;
}

const mockNotes: VoiceNote[] = [
  { id: "1", title: "Call notes - TechCorp meeting", duration: "2:34", createdAt: "2026-02-13T10:30:00", tags: ["meeting", "techcorp"], linkedTo: { type: "Deal", name: "Enterprise Implementation" }, transcript: "Discussed timeline for implementation. Client wants to start by March. Budget confirmed at $45K." },
  { id: "2", title: "Follow-up ideas for Q1", duration: "1:15", createdAt: "2026-02-12T14:00:00", tags: ["strategy", "q1"], transcript: "Focus on upselling existing clients. Prepare case studies for new verticals." },
  { id: "3", title: "Product feedback from Sarah", duration: "3:42", createdAt: "2026-02-11T09:15:00", tags: ["feedback", "product"], linkedTo: { type: "Contact", name: "Sarah Johnson" }, transcript: "Sarah mentioned needing better reporting features. Also interested in API integrations." },
  { id: "4", title: "Pipeline review summary", duration: "5:10", createdAt: "2026-02-10T16:00:00", tags: ["pipeline", "review"], transcript: "Three deals in negotiation stage. Expected close for two by end of month." },
  { id: "5", title: "Competitor analysis notes", duration: "4:22", createdAt: "2026-02-09T11:30:00", tags: ["competitive", "research"], transcript: "Main competitor launched new pricing. Our advantage remains in AI features and integrations." },
];

export default function VoiceNotes() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = mockNotes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) || n.tags.some(t => t.includes(search.toLowerCase()))
  );

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({ title: "Recording started", description: "Speak now... Click stop when done." });
    } else {
      toast({ title: "Recording saved", description: "Your voice note has been saved and is being transcribed." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Voice Notes</h1>
              <p className="text-muted-foreground mt-2">Record, transcribe, and organize voice memos for your CRM activities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-3"><FileAudio className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Total Notes</p><p className="text-2xl font-bold">{mockNotes.length}</p></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-secondary" /><div><p className="text-xs text-muted-foreground">Total Duration</p><p className="text-2xl font-bold">17:03</p></div></div></CardContent></Card>
            <Card className="card-hover"><CardContent className="p-6"><div className="flex items-center gap-3"><Tag className="h-5 w-5 text-accent" /><div><p className="text-xs text-muted-foreground">Tags Used</p><p className="text-2xl font-bold">10</p></div></div></CardContent></Card>
          </div>

          {/* Recording Area */}
          <Card className={`border-2 transition-colors ${isRecording ? "border-red-500 bg-red-500/5" : "border-primary/20"}`}>
            <CardContent className="p-8 text-center">
              <Button
                size="lg"
                onClick={toggleRecording}
                className={`h-20 w-20 rounded-full ${isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "gradient-primary"}`}
              >
                {isRecording ? <MicOff className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-primary-foreground" />}
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                {isRecording ? "Recording... Click to stop" : "Click to start recording a voice note"}
              </p>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search voice notes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="space-y-4">
            {filtered.map(note => (
              <Card key={note.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="mt-1 flex-shrink-0"
                        onClick={() => setPlayingId(playingId === note.id ? null : note.id)}
                      >
                        {playingId === note.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{note.title}</h3>
                          <span className="text-xs text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />{note.duration}</span>
                        </div>
                        {note.linkedTo && (
                          <p className="text-xs text-primary mb-1">{note.linkedTo.type}: {note.linkedTo.name}</p>
                        )}
                        {note.transcript && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{note.transcript}</p>
                        )}
                        <div className="flex gap-1">
                          {note.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(note.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}