import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus, Trash2, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import { uuidv4 } from "@/lib/meeting";

type AgendaItem = { id: string; text: string; done: boolean };

type Props = {
  items: AgendaItem[];
  onUpdate: (items: AgendaItem[]) => void;
  isHost: boolean;
};

export function AgendaPanel({ items, onUpdate, isHost }: Props) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    onUpdate([...items, { id: uuidv4(), text: newItem.trim(), done: false }]);
    setNewItem("");
  };

  const toggleItem = (id: string) => {
    onUpdate(items.map(it => it.id === id ? { ...it, done: !it.done } : it));
  };

  const removeItem = (id: string) => {
    onUpdate(items.filter(it => it.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-glass-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Meeting agenda
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Stay on track with shared agenda items.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground italic">No agenda items set.</p>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-xl glass border-glass-border transition-all ${
              item.done ? "opacity-50" : ""
            }`}
          >
            <Checkbox
              checked={item.done}
              onCheckedChange={() => toggleItem(item.id)}
              disabled={!isHost && !item.done} // Guests can't uncheck if they didn't check? Or maybe anyone can toggle?
              // Let's assume anyone can toggle for maximum collaboration, but only host can delete.
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item.text}
              </p>
            </div>
            {isHost && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {isHost && (
        <div className="p-4 border-t border-glass-border bg-card/40">
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add agenda item..."
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="h-9 text-xs bg-input/50"
            />
            <Button onClick={addItem} size="icon" className="h-9 w-9 shrink-0 shadow-glow">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
