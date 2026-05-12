import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, Trash2, X, Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function NotificationBell() {
  const { items, unread, markAllRead, markRead, remove, clear } = useNotifications();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground relative"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] grid place-items-center font-semibold leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card border-border shadow-elegant">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">{unread} unread</p>
          </div>
          <div className="flex gap-1">
            {unread > 0 && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={markAllRead}>
                <Check className="h-3 w-3" /> Mark all
              </Button>
            )}
            {items.length > 0 && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={clear} title="Clear all">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Inbox className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">You're all caught up.</p>
              <p className="text-xs text-muted-foreground mt-1">Meeting alerts and updates show up here.</p>
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 ${!n.read ? "bg-accent/30" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                        n.kind === "success" ? "bg-success"
                          : n.kind === "warning" ? "bg-warning"
                          : n.kind === "error" ? "bg-destructive"
                          : n.kind === "meeting" ? "bg-primary"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => {
                        markRead(n.id);
                        if (n.href) navigate({ to: n.href as "/dashboard" });
                      }}
                    >
                      <p className={`text-sm leading-snug ${n.read ? "text-muted-foreground" : "font-medium"}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.ts)}</p>
                    </button>
                    <button
                      onClick={() => remove(n.id)}
                      className="text-muted-foreground hover:text-destructive p-0.5"
                      title="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}