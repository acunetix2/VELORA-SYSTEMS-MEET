import { useEffect, useRef, useState, useCallback } from "react";
import { uuidv4 } from "@/lib/meeting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X, FileText, Image as ImageIcon, Download } from "lucide-react";
import { toast } from "sonner";

export type ChatMessage = {
  id: string;
  from: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;   // bytes
  ts: number;
  self?: boolean;
};

// P2P chunked transfer types (sent via onSendFile callback)
export type FileTransferProgress = {
  fileName: string;
  progress: number;   // 0-100
  done: boolean;
};

const CHUNK_SIZE = 16 * 1024; // 16 KB per chunk

type Props = {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  /** For small (<500KB) images: base64 data URL directly. For larger files: chunked. */
  onSendFile: (fileUrl: string, fileName: string, fileSize?: number) => void;
  /** Expose chunked sender; parent must wire up the DataChannel */
  dataChannels?: RTCDataChannel[];
};

export function ChatPanel({ messages, onSend, onSendFile, dataChannels = [] }: Props) {
  const [text, setText] = useState("");
  const [uploads, setUploads] = useState<Record<string, FileTransferProgress>>({});
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = () => {
    const t = text.trim();
    if (!t || t.length > 500) return;
    onSend(t);
    setText("");
  };

  const sendChunked = useCallback(async (file: File) => {
    const activeChannels = dataChannels.filter(dc => dc.readyState === "open");
    if (activeChannels.length === 0) {
      toast.error("No direct P2P channels available — share small files (<500KB) instead.");
      return;
    }

    const id = uuidv4();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const arrayBuffer = await file.arrayBuffer();

    const signal = JSON.stringify({
      kind: "file-start",
      id,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      mimeType: file.type,
    });
    activeChannels.forEach(dc => dc.send(signal));

    setUploads(p => ({ ...p, [id]: { fileName: file.name, progress: 0, done: false } }));

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const chunk = arrayBuffer.slice(start, start + CHUNK_SIZE);
      const chunkData = btoa(String.fromCharCode(...new Uint8Array(chunk)));
      const chunkMsg = JSON.stringify({
        kind: "file-chunk",
        id,
        index: i,
        data: chunkData,
      });

      // Throttle: wait for all buffers to drain below 1MB
      while (activeChannels.some(dc => dc.bufferedAmount > 1_000_000)) {
        await new Promise(r => setTimeout(r, 50));
      }

      activeChannels.forEach(dc => dc.send(chunkMsg));

      const progress = Math.round(((i + 1) / totalChunks) * 100);
      setUploads(p => ({ ...p, [id]: { fileName: file.name, progress, done: false } }));
    }

    const endMsg = JSON.stringify({ kind: "file-end", id });
    activeChannels.forEach(dc => dc.send(endMsg));
    setUploads(p => ({ ...p, [id]: { fileName: file.name, progress: 100, done: true } }));

    // Also create an object URL for local display
    const blob = new Blob([arrayBuffer], { type: file.type });
    const url = URL.createObjectURL(blob);
    onSendFile(url, file.name, file.size);

    setTimeout(() => {
      setUploads(p => { const n = { ...p }; delete n[id]; return n; });
    }, 3000);
  }, [dataChannels, onSendFile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size <= 500 * 1024) {
      // Small file: base64 via channel broadcast (existing path)
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result && typeof ev.target.result === "string") {
          onSendFile(ev.target.result, file.name, file.size);
        }
      };
      reader.readAsDataURL(file);
    } else if (file.size <= 50 * 1024 * 1024) {
      // Up to 50MB: chunked P2P
      await sendChunked(file);
    } else {
      toast.error("File must be smaller than 50MB for P2P transfer.");
    }
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (url: string) =>
    url.startsWith("data:image/") || url.startsWith("blob:") || /\.(png|jpe?g|gif|webp|svg)$/i.test(url);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-glass-border">
        <h3 className="font-semibold">Chat</h3>
        <p className="text-xs text-muted-foreground">
          Messages visible to everyone. Files up to 50MB via P2P.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center pt-10">No messages yet — say hi 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.self ? "items-end" : "items-start"}`}>
            <span className="text-[11px] text-muted-foreground mb-0.5 px-1">
              {m.self ? "You" : m.from}
            </span>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.self ? "bg-gradient-primary text-primary-foreground" : "glass"}`}>
              {m.text && <span>{m.text}</span>}
              {m.fileUrl && (
                <div className="mt-1">
                  {isImage(m.fileUrl) ? (
                    <img src={m.fileUrl} alt="attachment" className="rounded-lg max-h-48 object-cover" />
                  ) : (
                    <a
                      href={m.fileUrl}
                      download={m.fileName}
                      className="flex items-center gap-2 py-1 underline underline-offset-2 hover:opacity-80"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{m.fileName}</span>
                      {m.fileSize && (
                        <span className="text-[10px] opacity-70 shrink-0">{formatBytes(m.fileSize)}</span>
                      )}
                      <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Upload progress bars */}
      {Object.entries(uploads).length > 0 && (
        <div className="px-4 pb-2 space-y-1.5">
          {Object.entries(uploads).map(([id, up]) => (
            <div key={id} className="glass rounded-xl px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium truncate max-w-[70%]">{up.fileName}</span>
                <span className="text-[11px] text-muted-foreground">{up.progress}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${up.done ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${up.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-glass-border flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.mp4,.mov"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          title="Attach file (up to 50MB via P2P)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Type a message…"
          maxLength={500}
          className="bg-input/60 border-glass-border h-10"
        />
        <Button
          onClick={submit}
          size="icon"
          disabled={!text.trim()}
          className="bg-gradient-primary text-primary-foreground border-0 shadow-glow shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
