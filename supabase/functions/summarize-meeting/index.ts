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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = transcript.slice(0, 16000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a concise meeting summarizer. Given a raw transcript, produce structured output via the tool call. Be specific, factual, and brief. Use the speaker labels when available.",
          },
          {
            role: "user",
            content: `Meeting ID: ${meetingId ?? "unknown"}\n\nTranscript:\n${trimmed}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_summary",
              description: "Return the structured meeting summary.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "A short, specific meeting title (max 8 words)." },
                  overview: { type: "string", description: "2-3 sentence overview of what was discussed." },
                  key_points: { type: "array", items: { type: "string" }, description: "3-6 key discussion points." },
                  decisions: { type: "array", items: { type: "string" }, description: "Decisions made (may be empty)." },
                  action_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task: { type: "string" },
                        owner: { type: "string", description: "Person responsible, or 'Unassigned'." },
                      },
                      required: ["task", "owner"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "overview", "key_points", "decisions", "action_items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_summary" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "AI rate limit reached. Try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable AI workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No structured response returned." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify({ summary: args }), {
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
