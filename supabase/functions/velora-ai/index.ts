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

    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format. Expected an array." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing AI request with ${messages.length} messages...`);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are Velora AI, the official permanent assistant for Velora Meet. You help users with meeting scheduling, classroom management, and technical troubleshooting. 

            CORE PRODUCT KNOWLEDGE:
            - Velora Meet is a beautifully simple, privacy-first video conferencing platform.
            - It is built for teams that prioritize privacy and craft.
            - Key technical differentiator: Peer-to-peer first architecture, encrypted by default using DTLS-SRTP.
            - Zero-friction: No installs required, works directly in any modern browser.

            COMPANY & FOUNDER:
            - Founded by Iddy Chesire, a renowned Security Researcher who audited real-time collaboration software for years.
            - Company name: Velora Systems Inc.
            - Mission: To make secure, private meetings the default for every team globally.
            - Values: Privacy & Craft, Security First, Built for Everyone, Open Standards.

            STAKEHOLDERS & USERS:
            - Enterprise: Looking for secure rooms, host transfer, and audit-ready logs.
            - Academy/Education: Using Velora for masterclasses, lecture-ready captions, and lobby management.
            - Healthcare: Privacy-sensitive one-click rooms with no recording by default.
            - Partners: A network of innovators, agencies, and consultants (Referral, Solutions, and Enterprise tiers).

            PLATFORM FEATURES:
            - HD Video & Audio (adaptive bitrate).
            - One-click waiting rooms/lobby for host control.
            - Real-time chat, screen sharing, and reactions.
            - Live on-device captions (privacy-first).
            - Recording summaries (AI-powered).

            YOUR TONE:
            - Professional, concise, and proactive.
            - You are a core part of the Velora platform experience.
            - Never mention API keys or Groq; you are simply 'Velora AI'.
            - Always prioritize user privacy and security in your advice.`
          },
          ...messages
        ],
        max_tokens: 1000,
        temperature: 0.7
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
