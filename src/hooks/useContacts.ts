import { useEffect, useState, useCallback } from "react";
import { uuidv4 } from "@/lib/meeting";

export type Contact = { id: string; name: string; email: string };
const KEY = "velora:contacts";

function load(): Contact[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items: Contact[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* noop */ }
}

export function useContacts() {
  const [items, setItems] = useState<Contact[]>([]);

  useEffect(() => {
    setItems(load());
    const refresh = () => setItems(load());
    window.addEventListener("velora:contacts", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("velora:contacts", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const add = useCallback((c: Omit<Contact, "id">) => {
    const next = [{ ...c, id: uuidv4() }, ...load()];
    save(next); setItems(next);
    window.dispatchEvent(new CustomEvent("velora:contacts"));
  }, []);

  const remove = useCallback((id: string) => {
    const next = load().filter((c) => c.id !== id);
    save(next); setItems(next);
    window.dispatchEvent(new CustomEvent("velora:contacts"));
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<Contact, "id">>) => {
    const next = load().map((c) => c.id === id ? { ...c, ...patch } : c);
    save(next); setItems(next);
    window.dispatchEvent(new CustomEvent("velora:contacts"));
  }, []);

  return { items, count: items.length, add, remove, update };
}