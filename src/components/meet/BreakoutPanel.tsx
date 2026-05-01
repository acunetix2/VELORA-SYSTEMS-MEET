import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2, ArrowRight, DoorOpen } from "lucide-react";
import { toast } from "sonner";

type BreakoutRoom = { id: string; name: string; capacity: number };

type Props = {
  rooms: BreakoutRoom[];
  onUpdate: (rooms: BreakoutRoom[]) => void;
  isHost: boolean;
};

export function BreakoutPanel({ rooms, onUpdate, isHost }: Props) {
  const [roomName, setRoomName] = useState("");

  const addRoom = () => {
    if (!roomName.trim()) return;
    onUpdate([...rooms, { id: crypto.randomUUID(), name: roomName.trim(), capacity: 0 }]);
    setRoomName("");
    toast.success(`Breakout room "${roomName}" created.`);
  };

  const removeRoom = (id: string) => {
    onUpdate(rooms.filter(r => r.id !== id));
  };

  const startBreakout = () => {
    toast.info("Breakout session started. Participants are being moved...");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-glass-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-primary" />
          Breakout Rooms
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Divide participants into smaller groups for focused discussion.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {rooms.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No rooms created yet.</p>
          </div>
        )}

        {rooms.map((room) => (
          <div
            key={room.id}
            className="group flex items-center justify-between p-4 rounded-2xl glass border-glass-border hover:border-primary/30 transition-all"
          >
            <div>
              <p className="text-sm font-medium">{room.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                {room.capacity} Participants
              </p>
            </div>
            {isHost && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRoom(room.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {isHost && (
        <div className="p-4 border-t border-glass-border bg-card/40 space-y-3">
          <div className="flex gap-2">
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room name..."
              className="h-10 text-sm bg-input/50"
            />
            <Button onClick={addRoom} size="icon" className="h-10 w-10 shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <Button
            className="w-full h-11 bg-gradient-primary shadow-glow font-semibold"
            disabled={rooms.length === 0}
            onClick={startBreakout}
          >
            Start Breakout Session
          </Button>
        </div>
      )}
    </div>
  );
}
