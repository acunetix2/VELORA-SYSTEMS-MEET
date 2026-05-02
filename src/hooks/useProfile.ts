import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  color: string | null;
  country: string | null;
  timezone: string | null;
  terms_accepted_at: string | null;
  pronouns: string | null;
  title: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  updated_at: string;
};

/** Get the signed-in user's own profile, with realtime refresh on update. */
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refresh: fetchProfile };
}

/** Lookup a profile by user id (used to enrich participants in a meeting). */
export async function fetchProfileById(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}
