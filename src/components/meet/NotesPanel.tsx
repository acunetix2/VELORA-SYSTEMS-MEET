import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Eye, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";

export type SharedNote = {
  id: string;
  title: string;
  content: string; // text content (or "" for file-only)
  fileName?: string;
  fileDataUrl?: string; // base64 data URL when an attachment was shared
  fileType?: string;
  fromHost: string;
  ts: number;
};

type Props = {
  notes: SharedNote[];
  isHost: boolean;
  hostName: string;
  onShare: (note: Omit<SharedNote, "id" | "ts" | "fromHost">) => void;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB — kept small because we send through realtime

export function NotesPanel({ notes, isHost, hostName, onShare }: Props) {
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const [previewing, setPreviewing] = useState<SharedNote | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File too large — max 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error("read failed"));
        r.readAsDataURL(file);
      });
      setAttachment({ name: file.name, type: file.type || "application/octet-stream", dataUrl });
    } catch {
      toast.error("Couldn't read that file.");
    } finally {
      setBusy(false);
    }
  };

  const share = () => {
    const title = draftTitle.trim() || (attachment ? attachment.name : "Shared note");
    const body = draftBody.trim();
    if (!body && !attachment) {
      toast.error("Add some text or attach a file first.");
      return;
    }
    onShare({
      title,
      content: body,
      fileName: attachment?.name,
      fileDataUrl: attachment?.dataUrl,
      fileType: attachment?.type,
    });
    toast.success("Note shared with everyone");
    setDraftTitle("");
    setDraftBody("");
    setAttachment(null);
  };

  const download = (n: SharedNote) => {
    if (n.fileDataUrl && n.fileName) {
      const a = document.createElement("a");
      a.href = n.fileDataUrl;
      a.download = n.fileName;
      a.click();
      return;
    }
    // text-only — generate a .txt
    const blob = new Blob([`# ${n.title}\n\nFrom: ${n.fromHost}\n\n${n.content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${n.title.replace(/[^\w-]+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-glass-border">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Shared notes
        </h3>
        <p className="text-xs text-muted-foreground">
          {isHost ? "Share notes or files with everyone in the meeting." : `Notes shared by ${hostName}.`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center pt-10">
            {isHost ? "Nothing shared yet — add a note below." : "The host hasn't shared any notes yet."}
          </p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="glass rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {n.fromHost} · {new Date(n.ts).toLocaleTimeString()}
                    {n.fileName ? ` · 📎 ${n.fileName}` : ""}
                  </p>
                </div>
              </div>
              {n.content && <p className="mt-2 text-sm whitespace-pre-wrap break-words text-foreground/90 line-clamp-4">{n.content}</p>}
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => setPreviewing(n)}>
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => download(n)}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {isHost && (
        <div className="border-t border-glass-border p-3 space-y-2 bg-card/40">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Title (optional)"
            maxLength={80}
            className="w-full h-9 rounded-md bg-input/60 border border-glass-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            placeholder="Type a note for everyone…"
            maxLength={4000}
            className="bg-input/60 border-glass-border min-h-20 text-sm"
          />
          {attachment ? (
            <div className="flex items-center gap-2 glass rounded-md px-2 py-1.5 text-xs">
              <span className="truncate flex-1">📎 {attachment.name}</span>
              <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              <Upload className="h-3.5 w-3.5" />
              Attach a file (max 5 MB)
              <input
                type="file"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
              />
            </label>
          )}
          <Button
            disabled={busy}
            onClick={share}
            className="w-full h-9 bg-gradient-primary text-primary-foreground border-0 shadow-glow gap-1.5"
          >
            <Send className="h-4 w-4" /> Share with everyone
          </Button>
        </div>
      )}

      {previewing && (
        <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-glass-border">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{previewing.title}</p>
              <p className="text-[11px] text-muted-foreground">{previewing.fromHost}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => download(previewing)}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPreviewing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {previewing.content && (
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap break-words text-sm text-foreground/90 font-sans">{previewing.content}</pre>
              </div>
            )}
            {previewing.fileDataUrl && previewing.fileType?.startsWith("image/") && (
              <img src={previewing.fileDataUrl} alt={previewing.fileName} className="mt-4 max-w-full rounded-lg" />
            )}
            {previewing.fileDataUrl && previewing.fileType === "application/pdf" && (
              <iframe src={previewing.fileDataUrl} title={previewing.fileName} className="mt-4 w-full h-[70vh] rounded-lg bg-white" />
            )}
            {previewing.fileDataUrl && !previewing.fileType?.startsWith("image/") && previewing.fileType !== "application/pdf" && (
              <div className="mt-4 glass rounded-lg p-4 text-sm text-muted-foreground">
                Preview not available for this file type — use Download instead.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}