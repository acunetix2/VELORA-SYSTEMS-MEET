
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Notification = {
  id: string;
  title: string;
  body?: string;
  kind: "info" | "success" | "meeting";
  ts: number;
  read: boolean;
};

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("ts", { ascending: false });
    
    if (!error && data) {
      setItems(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        body: d.body,
        kind: d.kind,
        ts: Number(d.ts),
        read: d.read
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
    
    let channel: any;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      channel = supabase
        .channel(`notifications-changes-${Math.random().toString(36).substring(2, 10)}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => fetchItems()
        )
        .subscribe();
    };

    setupSubscription();

    return () => { 
      if (channel) supabase.removeChannel(channel); 
    };
  }, [fetchItems]);

  const push = async (n: Partial<Notification>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notifications" as any).insert({
      user_id: user.id,
      title: n.title,
      body: n.body,
      kind: n.kind || "info",
      ts: n.ts || Date.now(),
      read: false
    });
    // fetchItems will be triggered by subscription
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications" as any).update({ read: true }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications" as any).update({ read: true }).eq("user_id", user.id);
    setItems(prev => prev.map(i => ({ ...i, read: true })));
  };

  const remove = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clear = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications" as any).delete().eq("user_id", user.id);
    setItems([]);
  };

  return { 
    items, 
    unread: items.filter(i => !i.read).length,
    push, 
    markRead, 
    markAllRead, 
    remove, 
    clear,
    loading 
  };
}