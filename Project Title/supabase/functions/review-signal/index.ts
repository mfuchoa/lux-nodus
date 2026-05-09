import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SignalInput {
  situation: string;
  description: string;
  outcome: string;
  context: string;
}

interface ReviewResult {
  status: "accept" | "question" | "decline";
  message: string;
}

const SYSTEM_PROMPT = "You are a warm, encouraging quality reviewer for Lux, a peer knowledge platform for neurodivergent care communities. Read the four signal fields and return JSON only with two fields: status (accept, question, or decline) and message (one warm sentence). Accept if the signal has enough context to help someone in a similar situation. Ask a question if one key detail is missing. Decline gently only if completely unusable. Never be harsh — this community shares vulnerable knowledge.";

function buildUserPrompt(input: SignalInput): string {
  const sit = (input.situation || "").trim() || "(empty)";
  const desc = (input.description || "").trim() || "(empty)";
  const out = (input.outcome || "").trim() || "(empty)";
  const ctx = (input.context || "").trim() || "(empty)";
  return "Review this signal submission:\n\nSituation: " + sit + "\nDescription: " + desc + "\nOutcome: " + out + "\nContext: " + ctx + '\n\nReturn only valid JSON: {"status": "accept" | "question" | "decline", "message": "..."}';
}

async function reviewWithClaude(input: SignalInput): Promise<ReviewResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const body = {
    model: "claude-3-haiku-20240307",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(input),
      },
    ],
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error("Anthropic API error " + response.status + ": " + errBody);
  }

  const data = await response.json();
  const text = data && data.content && data.content[0] && data.content[0].text ? data.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const validStatuses = ["accept", "question", "decline"];
  if (!validStatuses.includes(parsed.status) || typeof parsed.message !== "string") {
    throw new Error("Invalid response shape from Claude");
  }

  return { status: parsed.status, message: parsed.message };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const input: SignalInput = await req.json();
    const result = await reviewWithClaude(input);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("review-signal error:", err);
    return new Response(
      JSON.stringify({
        status: "decline",
        message: "Something went wrong while reviewing. You can still submit your signal directly — your experience matters.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
