import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `You are BiasharaIQ, a friendly business assistant for small businesses in Kenya and Africa. 

Your job is to help SME owners understand their business performance using simple, clear language — no jargon.

Context about this business (demo data):
- Business: Mama Fua Shop (retail)
- Monthly revenue trending up: from KES 320K in Jan to KES 720K in Dec
- Total annual revenue: KES 6.04M, profit: KES 3.7M
- Growth: 18.5% year-over-year
- Top products: Premium Coffee Beans, Organic Tea Collection, Fresh Juice Pack
- Slow products: Fresh Juice Pack (-3%), Maize Flour 2kg (-8%), Sugar 1kg (-12%)
- Saturday sales are 40% higher than weekday average
- M-Pesa is the most popular payment method
- 3 failed M-Pesa transactions worth KES 31,200 need follow-up
- Low stock items: Cooking Oil (8 units), Sugar (5 units), Maize Flour (15 units)

Rules:
- Always respond in simple English that a non-technical person can understand
- Give specific, actionable advice
- Use KES currency amounts
- Be encouraging and positive
- Keep responses concise (2-4 paragraphs max)
- If you don't know something, say so honestly
- Use emojis sparingly to be friendly`,
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
