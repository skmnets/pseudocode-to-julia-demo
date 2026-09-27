# Backend Proxy for Pseudocode → Julia Constrained Translator

This directory contains the lightweight serverless backend proxy that securely connects the frontend to an LLM provider (such as OpenAI GPT-4o-mini).

## Why a Backend Proxy is Required

**Critical Security Rule:** An OpenAI API key or any private AI service credential must **NEVER** be committed into git or hardcoded into client-side JavaScript on GitHub Pages. Any key in frontend JavaScript can be trivially stolen and abused.

The serverless proxy acts as a secure intermediary:
1. Receives the student's problem, reasoning, and pseudocode from the browser.
2. Injects the strict **11-rule Constrained Translator system prompt**.
3. Authenticates with OpenAI using a private environment variable secret.
4. Returns only the generated Julia code and metadata back to the client.

---

## Option 1: Deploy with Cloudflare Workers (Recommended)

Cloudflare Workers offers a free tier with 100,000 requests per day and zero cold starts.

### 1. Prerequisites
Install Node.js and Wrangler CLI:
```bash
npm install -g wrangler
# or use npx wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Initialize & Deploy
In this `backend/` directory:
```bash
# Copy example configuration
cp wrangler.toml.example wrangler.toml

# Set your secret API key (Wrangler will prompt you to enter the key safely)
wrangler secret put OPENAI_API_KEY

# Deploy the worker
wrangler deploy
```

### 4. Note Your Public Worker URL
Cloudflare will output a public endpoint, for example:
```
https://pseudocode-to-julia-proxy.<your-subdomain>.workers.dev
```

In the frontend website, open the **Backend & Settings** modal and paste this URL (or `https://.../generate`).

---

## Option 2: Deploy with Vercel

If you already use Vercel:

1. Copy `api-generate.js` to an `api/generate.js` file in a Vercel project repo.
2. Deploy to Vercel via CLI or git:
   ```bash
   vercel
   ```
3. In the Vercel Project Dashboard:
   - Navigate to **Settings** → **Environment Variables**.
   - Add `OPENAI_API_KEY` = your secret key.
   - Optionally add `OPENAI_MODEL` = `gpt-4o-mini`.
4. Your endpoint URL will be:
   ```
   https://your-project.vercel.app/api/generate
   ```

---

## Testing the Proxy Directly

You can verify the backend is running with `curl`:

```bash
# Health check (GET)
curl https://your-worker-url.workers.dev/

# Translation test (POST)
curl -X POST https://your-worker-url.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{
    "problem": "Write a function positive_mean(x)",
    "explanation": "Sum positive items and divide by count",
    "pseudocode": "total = 0\ncount = 0\nfor v in x\n  if v > 0\n    total = total + v\n    count = count + 1\n  end\nend\nreturn total / count"
  }'
```
