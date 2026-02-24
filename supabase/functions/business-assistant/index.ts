import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, businessContext, assistantMemory, outputMode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextPayload = {
      businessContext: businessContext ?? null,
      assistantMemory: Array.isArray(assistantMemory) ? assistantMemory : [],
      outputMode: outputMode ?? "plain_text",
    };

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
            content: `You are Biz Insights Africa Assistant, a trusted business companion for SME founders in Africa.

Core behavior:
- Understand each user question carefully and answer the exact question first.
- Use the provided business context and memory records.
- Use business context only when relevant to the question asked.
- Give direct, practical, actionable recommendations.
- Be calm, clear, supportive, and non-judgmental.
- If information is missing, state what is missing and give a best-effort recommendation.

Greeting behavior:
- If the user sends only a greeting (like hello, hi, jambo) or small talk, reply with a short greeting and one short offer to help.
- Do not provide a business report, metrics summary, or unsolicited recommendations unless asked.

Output rules (strict):
- Return plain text only.
- Do NOT use markdown, bullet symbols, headings, code blocks, or markup.
- Keep response concise and useful, usually 4 to 10 sentences.
- Use KES for money values where relevant.`,
          },
          {
            role: "system",
            content: `Business profile and memory context:\n${JSON.stringify(contextPayload)}`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
