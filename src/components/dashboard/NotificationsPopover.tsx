
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { Bell, Check, Trash2, Info, Video, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPopover() {
  const { items, unread, markAllRead, markRead, remove, clear } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="h-9 w-9 grid place-items-center rounded-xl hover:bg-card/60 text-muted-foreground hover:text-foreground relative transition-all" 
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-3.5 min-w-[14px] px-0.5 rounded-full bg-primary text-[9px] font-bold text-white grid place-items-center ring-2 ring-background">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 glass border-glass-border shadow-elegant overflow-hidden rounded-2xl">
        <div className="p-4 border-b border-glass-border flex items-center justify-between bg-card/20">
          <h3 className="font-bold text-sm">Notifications</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markAllRead} title="Mark all read">
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={clear} title="Clear all">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
          {items.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-muted/20 grid place-items-center mx-auto mb-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground">No new alerts at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-glass-border/50">
              {items.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 flex gap-3 transition-colors hover:bg-card/40 cursor-pointer ${n.read ? 'opacity-60' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={`h-8 w-8 rounded-lg shrink-0 grid place-items-center ${
                    n.kind === 'meeting' ? 'bg-primary/10 text-primary' :
                    n.kind === 'success' ? 'bg-green-500/10 text-green-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {n.kind === 'meeting' ? <Video className="h-4 w-4" /> :
                     n.kind === 'success' ? <Zap className="h-4 w-4" /> :
                     <Info className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className={`text-[13px] leading-tight ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(n.ts, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
