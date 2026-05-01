
import { supabase } from "@/integrations/supabase/client";

export type AttendanceRecord = {
  meetingId: string;
  role: "host" | "participant";
  timestamp: number;
};

export async function trackMeetingJoin(meetingId: string, role: "host" | "participant") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // We use a separate table 'meeting_history' in Supabase
    const { error } = await supabase
      .from("meeting_history" as any)
      .insert({
        user_id: user.id,
        meeting_id: meetingId,
        role: role,
        timestamp: new Date().toISOString()
      });
    
    if (error) console.error("Error tracking meeting:", error);
  } catch (e) {
    console.error("Analytics failed:", e);
  }
}

export async function getAnalytics() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { hostCount: 0, participantCount: 0, totalMeetings: 0, history: [] };

  try {
    const { data, error } = await supabase
      .from("meeting_history" as any)
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    const history = data || [];
    const hostMeetings = history.filter((h: any) => h.role === "host");
    const participantMeetings = history.filter((h: any) => h.role === "participant");

    return {
      hostCount: hostMeetings.length,
      participantCount: participantMeetings.length,
      totalMeetings: history.length,
      history
    };
  } catch (e) {
    console.error("Failed to fetch analytics:", e);
    return { hostCount: 0, participantCount: 0, totalMeetings: 0, history: [] };
  }
}
