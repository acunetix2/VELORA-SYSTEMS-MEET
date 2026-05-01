import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Pen, Trash2, Download } from "lucide-react";

export type DrawEvent = {
  x: number;
  y: number;
  color: string;
  size: number;
  isStarting: boolean;
};

export type WhiteboardProps = {
  onDraw: (event: DrawEvent) => void;
  incomingEvents: DrawEvent[];
  onClear: () => void;
  clearTrigger: number; // incrementing counter to trigger clear
};

export function WhiteboardPanel({ onDraw, incomingEvents, onClear, clearTrigger }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(3);
  const [mode, setMode] = useState<"pen" | "eraser">("pen");

  // Keep track of last pos for smooth lines
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Resize canvas to fit container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    // Set internal resolution once
    if (canvas.width === 0) {
      canvas.width = 1600;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1e1e24"; // dark background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const drawLine = useCallback((x: number, y: number, c: string, s: number, isStarting: boolean) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (isStarting) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = c;
      ctx.lineWidth = s;
      ctx.stroke();
      lastPos.current = { x, y };
    } else if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = c;
      ctx.lineWidth = s;
      ctx.stroke();
      lastPos.current = { x, y };
    }
  }, []);

  // Process incoming events
  const processedEvents = useRef(0);
  useEffect(() => {
    const newEvents = incomingEvents.slice(processedEvents.current);
    newEvents.forEach(e => {
      // Remote drawing doesn't track lastPos the same way, we might need a separate ref per user,
      // but for simplicity we can just treat it as points if we don't have user IDs.
      // Actually, if isStarting is true, we reset. 
      // This is a simplified whiteboard. For better results we'd need a map of peerId -> lastPos.
      drawLine(e.x, e.y, e.color, e.size, e.isStarting);
    });
    processedEvents.current = incomingEvents.length;
  }, [incomingEvents, drawLine]);

  // Handle remote clear
  useEffect(() => {
    if (clearTrigger > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.fillStyle = "#1e1e24";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [clearTrigger]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    // Map to internal resolution
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const c = mode === "eraser" ? "#1e1e24" : color;
    const s = mode === "eraser" ? size * 5 : size;
    drawLine(x, y, c, s, true);
    onDraw({ x, y, color: c, size: s, isStarting: true });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const c = mode === "eraser" ? "#1e1e24" : color;
    const s = mode === "eraser" ? size * 5 : size;
    drawLine(x, y, c, s, false);
    onDraw({ x, y, color: c, size: s, isStarting: false });
  };

  const handleEnd = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    onClear();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "whiteboard.png";
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-card/50">
      <div className="flex items-center justify-between p-2 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={mode === "pen" ? "secondary" : "ghost"}
            onClick={() => setMode("pen")}
            className="h-8 w-8"
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={mode === "eraser" ? "secondary" : "ghost"}
            onClick={() => setMode("eraser")}
            className="h-8 w-8"
          >
            <Eraser className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-glass-border mx-1" />
          {["#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#eab308"].map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setMode("pen"); }}
              className={`h-6 w-6 rounded-full border-2 ${color === c && mode === "pen" ? "border-primary" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={clearCanvas} className="text-destructive h-8 px-2 text-xs">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
          <Button size="sm" variant="ghost" onClick={downloadCanvas} className="h-8 px-2 text-xs">
            <Download className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </div>
      
      <div 
        ref={containerRef} 
        className="flex-1 relative overflow-hidden touch-none"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain cursor-crosshair"
        />
      </div>
    </div>
  );
}
