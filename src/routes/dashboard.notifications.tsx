import { createFileRoute } from "@tanstack/react-router";
import { useNotifications } from "@/hooks/useNotifications";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Info, Video, Clock, ChevronDown } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/notifications")({
  component: NotificationsPage,
});

function sentenceCase(str: string) {
  if (!str) return "";
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function NotificationsPage() {
  const { items, unread, markAllRead, markRead, remove, clear } = useNotifications();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const grouped = items.reduce((acc, item) => {
    const date = new Date(item.ts);
    let key = "Older";
    if (isToday(date)) key = "Today";
    else if (isYesterday(date)) key = "Yesterday";
    else key = format(date, "MMMM d, yyyy");
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <DashboardShell title="Activity Hub">
      <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Stay updated on all activity and events across your organization.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={markAllRead} disabled={unread === 0} variant="velora-save" size="thin">
              <Check className="h-3.5 w-3.5 mr-1.5" /> Mark all read
            </Button>
            <Button onClick={clear} disabled={items.length === 0} variant="velora-cancel" size="thin">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear all
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-card border border-glass-border rounded-[2.5rem] py-24 px-8 text-center shadow-sm">
            <div className="h-20 w-20 rounded-full bg-primary/5 text-primary grid place-items-center mx-auto mb-6">
              <Bell className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No recent activity</h2>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">There are no new notifications. Activity will appear here when things happen.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([dateLabel, dateItems]) => (
              <div key={dateLabel}>
                <h3 className="text-[11px] uppercase tracking-widest font-black text-muted-foreground/60 mb-3 px-2">
                  {dateLabel}
                </h3>
                <div className="bg-card border border-glass-border rounded-[1.5rem] shadow-sm overflow-hidden divide-y divide-glass-border/50">
                  {dateItems.map((n) => {
                    const isExpanded = expandedId === n.id;
                    return (
                      <div
                        key={n.id}
                        className={`group flex flex-col transition-all cursor-pointer ${
                          n.read ? 'bg-background/30 hover:bg-background/50' : 'bg-primary/5 hover:bg-primary/10'
                        }`}
                        onClick={() => {
                          if (!n.read) markRead(n.id);
                          setExpandedId(isExpanded ? null : n.id);
                        }}
                      >
                        <div className="flex items-center gap-4 px-6 py-4 min-h-[4rem]">
                          <div className={`h-10 w-10 rounded-[12px] shrink-0 grid place-items-center shadow-inner ${
                            n.kind === 'meeting' ? 'bg-indigo-500/10 text-indigo-500' :
                            n.kind === 'success' ? 'bg-green-500/10 text-green-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {n.kind === 'meeting' ? <Video className="h-5 w-5" /> :
                             n.kind === 'success' ? <Bell className="h-5 w-5" /> :
                             <Info className="h-5 w-5" />}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                            <h3 className={`text-sm truncate ${n.read ? 'font-medium text-foreground/70' : 'font-bold text-foreground'}`}>
                              {sentenceCase(n.title)}
                            </h3>
                            <div className="shrink-0 flex items-center gap-3">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {formatDistanceToNow(n.ts, { addSuffix: true })}
                              </span>
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-6 pb-5 pt-2 ml-[3.25rem] animate-in fade-in slide-in-from-top-2 duration-200">
                            {n.body && (
                              <p className="text-[14px] text-muted-foreground/90 leading-relaxed mb-4">
                                {n.body}
                              </p>
                            )}
                            <div className="flex gap-2">
                              {!n.read && (
                                <Button onClick={(e) => { e.stopPropagation(); markRead(n.id); }} variant="outline" className="h-7 px-3 rounded-lg text-[10px] font-bold text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">
                                  Mark read
                                </Button>
                              )}
                              <Button onClick={(e) => { e.stopPropagation(); remove(n.id); }} variant="ghost" className="h-7 px-3 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
