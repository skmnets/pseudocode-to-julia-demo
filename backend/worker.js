/**
 * Cloudflare Worker: Pseudocode to Julia Constrained Translator
 *
 * Environment variables required in Cloudflare Worker settings:
 * - OPENAI_API_KEY: Secret key for OpenAI API
 * - OPENAI_MODEL (optional, defaults to "gpt-4o-mini")
 * - ALLOWED_ORIGIN (optional, defaults to "*" or your GitHub Pages origin)
 */

const SYSTEM_PROMPT = `You are a constrained pseudocode-to-Julia translator for an educational assessment tool.

Your task is to translate the student's stated algorithm into Julia code.

IMPORTANT RULES:

1. Implement the student's algorithm as faithfully and literally as possible.

2. Do NOT silently repair conceptual or algorithmic mistakes.

3. Do NOT introduce missing algorithmic steps merely because you know a better solution.

4. Do NOT replace the student's algorithm with a more efficient, idiomatic, or mathematically correct algorithm.

5. You may translate obvious pseudocode operations into valid Julia syntax.

6. You may make minimal syntactic adaptations required for Julia code to parse.

7. If the student's instructions are ambiguous, choose the most literal reasonable interpretation rather than improving the algorithm.

8. If an essential step is completely unspecified and cannot reasonably be translated, insert a comment such as:

# Student algorithm does not specify how this value should be computed.

9. Preserve the structure of the student's algorithm whenever possible: loops should remain loops, explicit conditionals should remain conditionals, and manually described calculations should not be replaced with higher-level library functions unless the student explicitly requested them.

10. Do not explain or critique the student's reasoning.

11. Return only Julia code.

The purpose of this system is to make the generated implementation reflect the quality of the student's algorithmic specification rather than the model's ability to solve the problem.`;

function getCorsHeaders(request, env) {
  const allowedOrigin = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

    // Handle preflight CORS request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check endpoint
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "pseudocode-to-julia-proxy",
          mode: "constrained-pedagogy-v1",
          hasApiKey: Boolean(env.OPENAI_API_KEY),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error:
              "Backend is running, but OPENAI_API_KEY is not configured in the worker environment secrets.",
            hint: "Configure OPENAI_API_KEY in Cloudflare Worker settings or switch the frontend to Demo Mode.",
          }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const body = await request.json();
      const { problem = "", explanation = "", pseudocode = "", mode = "constrained" } = body;

      if (!pseudocode.trim()) {
        return new Response(
          JSON.stringify({ error: "Pseudocode field cannot be empty." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Build system prompt based on mode (supports comparison demo if requested)
      const systemInstruction =
        mode === "unconstrained"
          ? "You are a helpful coding assistant. Translate the student's logic into clean, idiomatic, and correct Julia code, fixing any algorithmic bugs or gaps."
          : SYSTEM_PROMPT;

      const userContent = `### PROBLEM STATEMENT:
${problem.trim() || "Translate the provided algorithm into Julia."}

### STUDENT'S LOGICAL EXPLANATION:
${explanation.trim() || "No separate explanation provided."}

### STUDENT'S PSEUDOCODE / ALGORITHM:
${pseudocode.trim()}`;

      const model = env.OPENAI_MODEL || "gpt-4o-mini";

      const openAiPayload = {
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
      };

      const openAiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(openAiPayload),
        }
      );

      if (!openAiResponse.ok) {
        const errorData = await openAiResponse.text();
        return new Response(
          JSON.stringify({
            error: `OpenAI upstream error: ${openAiResponse.statusText}`,
            details: errorData,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const openAiData = await openAiResponse.json();
      let rawJulia = openAiData.choices?.[0]?.message?.content || "";

      // Strip markdown code fences if model returned ```julia ... ```
      const fenceMatch = rawJulia.match(/^```(?:julia)?\s*([\s\S]*?)```$/i);
      const cleanedJulia = fenceMatch ? fenceMatch[1].trim() : rawJulia.trim();

      return new Response(
        JSON.stringify({
          success: true,
          julia_code: cleanedJulia,
          model_used: model,
          mode_used: mode,
          timestamp: new Date().toISOString(),
          prompt_sent: {
            system: systemInstruction,
            user: userContent,
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Internal server error processing translation request.",
          details: err.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};
