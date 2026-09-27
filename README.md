# Pseudocode &rarr; Julia: Testing Computational Reasoning Before Implementation

> **Teaching Prototype & Proof-of-Concept for University Computer Science Courses (e.g., CAP 6318)**  
> **Live Site:** [https://skmnets.github.io/pseudocode-to-julia-demo/](https://skmnets.github.io/pseudocode-to-julia-demo/)

---

## 1. Pedagogical Hypothesis & Purpose

### The Challenge
When students use generative AI (such as ChatGPT, Copilot, or Claude) directly, models typically generate both the algorithm and the syntax simultaneously. If a student prompts with a vague or flawed specification, unconstrained LLMs silently repair the student's algorithmic reasoning, fill in missing edge cases, or replace manual logic with high-level library primitives. This obscures whether the student truly understands computational problem decomposition or is simply accepting opaque AI output.

### The Educational Solution
This prototype demonstrates an alternative pedagogical framework:
1. **Algorithmic Reasoning First:** The student must decompose the problem and write an explicit step-by-step specification or pseudocode.
2. **Constrained Implementation Layer:** An LLM acts **strictly as an implementation translator**, converting the student's pseudocode into syntactically valid Julia.
3. **No Silent Repair:** The model is bound by strict system instructions forbidding it from fixing conceptual bugs, introducing unprompted steps, or rewriting the student's algorithm.
4. **Pedagogical Separation:** Algorithmic understanding is cleanly decoupled from syntax memorization. If the student specifies a flawed algorithm, the resulting Julia program faithfully executes that flawed logic, allowing automated test suites to identify conceptual misunderstandings.

---

## 2. Architecture & Directory Tree

```
pseudocode-to-julia-demo/
│
├── index.html                      # Clean, academic single-page interface
├── css/
│   └── style.css                   # Responsive, accessible, minimal academic styling
├── js/
│   ├── app.js                      # Core controller, syntax highlighting, state management
│   ├── problems.js                 # 5 benchmark problems + custom problem definition
│   └── demo.js                     # Predefined demo cases & fallback evaluator
├── backend/
│   ├── worker.js                   # Cloudflare Worker proxy (CORS & OpenAI secret injection)
│   ├── api-generate.js             # Vercel Serverless Function alternative
│   ├── system_prompt.txt           # 11-rule constrained translator system prompt
│   ├── wrangler.toml.example       # Cloudflare configuration template
│   └── README.md                   # Backend deployment guide
├── .github/
│   └── workflows/
│       └── pages.yml               # Automated GitHub Pages CI/CD workflow
├── .gitignore                      # Excludes secrets, node_modules, and OS caches
├── LICENSE                         # MIT License
└── README.md                       # Comprehensive project documentation
```

---

## 3. Running Locally

Because the frontend is built with vanilla HTML, CSS, and JavaScript, it requires **zero build steps** and no package installation to test locally.

### Using Python (Built-in)
```bash
# Navigate to the repository root
cd pseudocode-to-julia-demo

# Start Python's built-in HTTP server
python -m http.server 8000
```
Open your browser to: `http://localhost:8000/`

### Using Node.js (npx)
```bash
cd pseudocode-to-julia-demo
npx serve .
```

---

## 4. GitHub Pages Deployment (Account: `skmnets`)

Follow these exact steps to publish the site to `https://skmnets.github.io/pseudocode-to-julia-demo/`:

### Step 1: Create the GitHub Repository
1. Log into your GitHub account: **`skmnets`**.
2. Go to [https://github.com/new](https://github.com/new).
3. Set **Repository name** to: `pseudocode-to-julia-demo`.
4. Choose **Public**.
5. Leave "Add a README file" and ".gitignore" unchecked (the local project already includes them).
6. Click **Create repository**.

### Step 2: Push Local Files to GitHub
Open a terminal in this project directory:
```bash
git init
git add .
git commit -m "feat: initial release of pseudocode-to-julia educational demo"
git branch -M main
git remote add origin https://github.com/skmnets/pseudocode-to-julia-demo.git
git push -u origin main
```

### Step 3: Enable GitHub Pages in Repository Settings
1. On GitHub, navigate to your repository: `https://github.com/skmnets/pseudocode-to-julia-demo`.
2. Click **Settings** (top tab) &rarr; **Pages** (left sidebar).
3. Under **Build and deployment**:
   - **Source:** Select **GitHub Actions** (the included `.github/workflows/pages.yml` will automatically trigger and deploy).
   *(Alternatively, you can select "Deploy from a branch", set branch to `main` and folder to `/(root)`, then click Save).*
4. Once the deployment action finishes (usually 30–60 seconds), the live website will be accessible at:
   ```
   https://skmnets.github.io/pseudocode-to-julia-demo/
   ```

*Note: All stylesheet and script references in `index.html` use relative paths (`./css/style.css`, `./js/app.js`), ensuring assets resolve correctly when hosted under the `/pseudocode-to-julia-demo/` sub-path.*

---

## 5. Demo Mode vs. Live Model Mode

### Demo Mode (Immediate, Zero API Key)
The application opens in **Demo Mode** by default.
- No OpenAI API key or backend deployment is required.
- Three built-in pedagogical scenarios demonstrate the core concept immediately:
  1. **Correct Algorithm:** Student tracks positive sum and positive count; model produces correct Julia; all tests pass.
  2. **Conceptual Error:** Student divides by `length(x)` instead of count of positives; model faithfully translates the bug; tests flag the error.
  3. **Missing Step:** Student writes *"calculate the degree of every node"* without algorithmic steps; model outputs `# Student algorithm does not specify how this value should be computed.`; tests fail.
- Clicking **Why constrain the model?** toggles between the **Literal Implementation** and a simulated **Standard AI** (which unhelpfully fixes the student's error).

### Live Model Mode (Real-Time OpenAI Translation)
To connect real-time queries to OpenAI GPT-4o-mini:
1. Deploy the serverless proxy in `backend/` (see instructions below).
2. Click the **Mode: Demo** button in the site header.
3. Select **Live Model Backend** and paste your backend endpoint (e.g., `https://pseudocode-to-julia-proxy.<user>.workers.dev/`).
4. Click **Test Connection** &rarr; **Save Settings**.
5. All future requests in the interface will query the live constrained model.

---

## 6. Backend Deployment & Secret Management

### Security Principle: Never Expose Keys in Frontend Code
Under no circumstances should an OpenAI API key be hardcoded in client-side HTML or JavaScript. On a public GitHub Pages site, client-side keys are readable by anyone viewing source code and will be compromised immediately.

The backend serverless proxy keeps your secret key safely on the server side:

```
[Browser on GitHub Pages]
        │
        ▼ (POST request: problem, pseudocode)
[Cloudflare Worker / Vercel Proxy]  <── Injects System Prompt + OPENAI_API_KEY secret
        │
        ▼
[OpenAI API (GPT-4o-mini)]
        │
        ▼ (Faithful Julia code only)
[Browser displays result & runs tests]
```

### Deploying the Cloudflare Worker in 3 Minutes
```bash
cd backend
npm install -g wrangler
wrangler login
cp wrangler.toml.example wrangler.toml

# Set your secret OpenAI API key securely
wrangler secret put OPENAI_API_KEY

# Deploy to Cloudflare's global edge network
wrangler deploy
```
Copy the resulting URL (e.g. `https://pseudocode-to-julia-proxy.<subdomain>.workers.dev/`) into the website's Settings modal.

---

## 7. The 11-Rule Constrained System Prompt

The proxy injects the following system prompt to enforce pedagogical restraint:

```
You are a constrained pseudocode-to-Julia translator for an educational assessment tool.

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

The purpose of this system is to make the generated implementation reflect the quality of the student's algorithmic specification rather than the model's ability to solve the problem.
```

---

## 8. Simulated vs. Sandboxed Julia Code Execution

### Current Prototype Behavior
For security and simplicity, the GitHub Pages interface does **not** evaluate arbitrary Julia code in the browser. Instead, it features a **Simulated Runner** that evaluates known algorithmic invariants against test cases to illustrate the assessment feedback loop.

### Future Architecture: Containerized Sandboxed Execution
To safely execute student Julia code in a production university environment:
- **Architecture:** A dedicated backend microservice running on containerized runners (e.g., Docker, Firecracker microVMs, or AWS Lambda with Julia runtime).
- **Security Safeguards:**
  - Strict resource quotas: CPU limits (e.g., 1 core, 2.0s wall clock timeout) and memory limits (e.g., 256MB).
  - Complete network isolation (`--net=none`) preventing external socket calls.
  - Read-only ephemeral root filesystem preventing disk tampering.
  - Dropped Linux capabilities (`CAP_SYS_ADMIN`, `CAP_NET_RAW` disabled) and non-root execution (`nobody:nogroup`).

---

## 9. Future Pedagogical Extensions

1. **Automated Unit Testing & Rubric Grading:** Automatically compute partial credit based on (a) pseudocode clarity and (b) test coverage of the translated Julia function.
2. **Side-by-Side LLM Behavioral Auditing:** Real-time side-by-side execution comparing unconstrained vs. constrained model outputs on student submissions.
3. **Instructor Assignment Builder:** Allow professors to author custom problems, hidden test cases, and algorithmic constraints via an instructor dashboard.
4. **Submission History & Revision Tracking:** Track how students refine their pseudocode in response to failing test cases, capturing the trajectory of computational problem-solving.
5. **LMS Integration:** Export results to Canvas/Blackboard gradebooks using LTI 1.3 standards.
6. **Anonymized Learning Analytics:** Research data collection on common algorithmic failure modes across university student cohorts (e.g., off-by-one errors, boundary handling, matrix dimensionality mismatches in network science).

---

## 10. License

Released under the [MIT License](LICENSE). Designed for university teaching and educational research.
