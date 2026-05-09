import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assignment_id, classroom_id, title, type, class_name } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get all students enrolled in this class
    const { data: members, error: membersError } = await supabase
      .from("classroom_members")
      .select("student_id")
      .eq("classroom_id", classroom_id)
      .eq("role", "student");

    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ message: "No students to notify." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get their emails
    const studentIds = members.map(m => m.student_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("display_name, id")
      .in("id", studentIds);

    if (profilesError) throw profilesError;

    // In a production environment, we'd fetch emails from auth.users (requires service role)
    // For this demonstration, we'll assume we have a way to send to these IDs.
    // We will use Resend as the email provider.
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not found. Skipping email dispatch.");
      return new Response(JSON.stringify({ message: "Email key not configured. In-app notification sent." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch emails from auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    const students = users.filter(u => studentIds.includes(u.id));

    const emailPromises = students.map(student => {
      const name = profiles.find(p => p.id === student.id)?.display_name || "Student";
      return fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Velora Academy <notifications@velora.ai>",
          to: student.email,
          subject: `New ${type}: ${title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
              <h1 style="color: #1a73e8; font-size: 24px;">New Assignment Posted</h1>
              <p>Hi ${name},</p>
              <p>A new <strong>${type}</strong> has been posted in <strong>${class_name}</strong>.</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin: 0; font-size: 18px;">${title}</h2>
                <p style="color: #666; font-size: 14px;">Log in to your dashboard to view details and check the deadline.</p>
              </div>
              <a href="https://velora.ai/dashboard/classroom" style="display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Classroom</a>
              <p style="margin-top: 30px; color: #999; font-size: 12px;">This is an automated notification from Velora Academy.</p>
            </div>
          `,
        }),
      });
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ message: `Notifications sent to ${students.length} students.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
