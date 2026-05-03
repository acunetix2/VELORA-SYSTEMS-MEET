const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GROQ_API_KEY) {
      console.error("ERROR: GROQ_API_KEY environment variable is not set.");
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not configured on the server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, mode } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format. Expected an array." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isUnbound = mode === "unbound";
    
    // Process messages to handle multi-modal content
    let hasImage = false;
    const processedMessages = messages.map(m => {
      if (m.image_url) {
        hasImage = true;
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Analyze this image." },
            { type: "image_url", image_url: { url: m.image_url } }
          ]
        };
      }
      return { role: m.role, content: m.content };
    });

    // Use higher performance models for unbound mode
    const model = hasImage 
      ? "llama-3.2-11b-vision-preview" 
      : (isUnbound ? "llama-3.3-70b-versatile" : "llama-3.3-70b-versatile");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: "system", 
            content: `You are Velora AI, the ${isUnbound ? "Unbound Intelligence Hub" : "Assistant"} for Velora Meet. 

            ${isUnbound ? "You are currently in UNBOUND mode. This means you have full access to deep analysis, high-density formatting, and detailed technical insights. You should provide comprehensive, expert-level responses." : "You are in Assistant mode. Be concise and helpful."}

            VELORA PRODUCT ECOSYSTEM:
            - Velora Meet: Privacy-first video conferencing (DTLS-SRTP encryption, P2P architecture).
            - Velora Hub: The central intelligence command center for meetings and tasks.
            - Velora Lab: Customizable AI personas and knowledge base injection.

            RECENT PLATFORM DEVELOPMENTS:
            1. Enhanced Lobby Management: One-click waiting rooms for superior host control and security.
            2. Advanced Live Captions: On-device, privacy-preserving real-time transcription.
            3. Recording Summaries: AI-powered distillation of key points, decisions, and action items.
            4. Adaptive Bitrate: HD video and audio that intelligently scales with network conditions.
            5. Real-time Collaboration: Integrated chat and expressive reactions.

            TONE & STYLE:
            - Premium, sophisticated, yet accessible.
            - Use structured Markdown: Use bolding, lists, and headers to organize information.
            - Always prioritize user privacy and the craft of the software.`
          },
          ...processedMessages
        ],
        max_tokens: isUnbound ? 4096 : 1000,
        temperature: isUnbound ? 0.6 : 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);
      return new Response(
        JSON.stringify({ error: "Groq API error", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
})
