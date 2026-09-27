/**
 * Vercel Serverless Function: api/generate.js
 *
 * For Vercel deployment:
 * Place this file under `api/generate.js` in a Vercel project or repo root.
 * Configure environment variable in Vercel Dashboard:
 * - OPENAI_API_KEY
 * - OPENAI_MODEL (optional, default: "gpt-4o-mini")
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

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      status: "healthy",
      service: "pseudocode-to-julia-vercel",
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "OPENAI_API_KEY is not configured in Vercel environment variables.",
      hint: "Set OPENAI_API_KEY in the Vercel dashboard under Settings > Environment Variables.",
    });
  }

  const { problem = "", explanation = "", pseudocode = "", mode = "constrained" } = req.body || {};

  if (!pseudocode || !pseudocode.trim()) {
    return res.status(400).json({ error: "Pseudocode field cannot be empty." });
  }

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

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(502).json({
        error: `OpenAI upstream error: ${upstream.statusText}`,
        details: errText,
      });
    }

    const data = await upstream.json();
    let rawJulia = data.choices?.[0]?.message?.content || "";
    const fenceMatch = rawJulia.match(/^```(?:julia)?\s*([\s\S]*?)```$/i);
    const cleanedJulia = fenceMatch ? fenceMatch[1].trim() : rawJulia.trim();

    return res.status(200).json({
      success: true,
      julia_code: cleanedJulia,
      model_used: model,
      mode_used: mode,
      timestamp: new Date().toISOString(),
      prompt_sent: {
        system: systemInstruction,
        user: userContent,
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: "Internal server error connecting to OpenAI.",
      details: err.message,
    });
  }
}
