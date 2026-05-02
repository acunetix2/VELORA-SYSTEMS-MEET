// Generates a meeting summary + action items from a transcript using Lovable AI.
// CORS-enabled, public (verify_jwt = false).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, meetingId } = await req.json();
    if (typeof transcript !== "string" || transcript.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Transcript is too short to summarize." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured (missing GROQ_API_KEY)." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = transcript.slice(0, 32000); // Llama has a larger context window

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a concise meeting summarizer. Given a raw transcript, produce structured JSON output. Be specific, factual, and brief. Return ONLY valid JSON that matches the requested schema.",
          },
          {
            role: "user",
            content: `Meeting ID: ${meetingId ?? "unknown"}\n\nTranscript:\n${trimmed}\n\nReturn JSON with: title, overview, key_points (array), decisions (array), action_items (array of {task, owner})`,
          },
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Groq gateway error", response.status, t);
      return new Response(JSON.stringify({ error: `Groq error: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "No response returned from AI." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = JSON.parse(content);
    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
