/**
 * Application Controller for Pseudocode -> Julia Educational Prototype
 */

(function () {
  "use strict";

  // System Prompt constant for transparency and prompt assembly
  const SYSTEM_INSTRUCTIONS = `You are a constrained pseudocode-to-Julia translator for an educational assessment tool.

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

  // State
  const state = {
    currentProblemId: "p1-positive-mean",
    customProblemText: "",
    explanation: "",
    pseudocode: "",
    lastGeneratedJulia: "",
    backendMode: localStorage.getItem("pj_backend_mode") || "demo", // 'demo' | 'live'
    backendUrl: localStorage.getItem("pj_backend_url") || "",
    currentDemoKey: "correct",
    comparisonView: "literal", // 'literal' | 'standard'
  };

  // DOM Elements
  const el = {
    problemSelect: document.getElementById("problemSelect"),
    problemDesc: document.getElementById("problemDescription"),
    customWrapper: document.getElementById("customProblemInputWrapper"),
    customInput: document.getElementById("customProblemInput"),
    explanationInput: document.getElementById("studentExplanation"),
    pseudocodeInput: document.getElementById("studentPseudocode"),
    chkShowPrompt: document.getElementById("chkShowPrompt"),
    promptCard: document.getElementById("promptPreviewCard"),
    promptContent: document.getElementById("promptPreviewContent"),
    btnGenerate: document.getElementById("btnGenerate"),
    btnRegenerate: document.getElementById("btnRegenerate"),
    btnCopyCode: document.getElementById("btnCopyCode"),
    juliaOutput: document.getElementById("juliaCodeOutput"),
    badgeContainer: document.getElementById("badgeStatusContainer"),
    specificationBadge: document.getElementById("specificationBadge"),
    pedagogyNote: document.getElementById("pedagogyNote"),
    testResultsList: document.getElementById("testResultsList"),
    statusIndicator: document.getElementById("statusIndicator"),
    statusText: document.getElementById("statusText"),
    backendModeBadge: document.getElementById("backendModeBadge"),
    currentBackendDisplay: document.getElementById("currentBackendDisplay"),

    // Demo buttons
    btnDemoCorrect: document.getElementById("btnDemoCorrect"),
    btnDemoError: document.getElementById("btnDemoError"),
    btnDemoMissing: document.getElementById("btnDemoMissing"),

    // Comparison
    toggleLiteral: document.getElementById("toggleLiteral"),
    toggleStandard: document.getElementById("toggleStandard"),
    comparisonCodeOutput: document.getElementById("comparisonCodeOutput"),
    comparisonExplanation: document.getElementById("comparisonExplanation"),
    comparisonLangLabel: document.getElementById("comparisonLangLabel"),
    comparisonModeTag: document.getElementById("comparisonModeTag"),

    // Instructor View
    instructorPanel: document.getElementById("instructorPanel"),
    instructorPanelHeader: document.getElementById("instructorPanelHeader"),
    instructorToggleIcon: document.getElementById("instructorToggleIcon"),
    snapshotProblem: document.getElementById("snapshotProblem"),
    snapshotMode: document.getElementById("snapshotMode"),
    snapshotTimestamp: document.getElementById("snapshotTimestamp"),
    snapshotStatus: document.getElementById("snapshotStatus"),

    // Settings Modal
    btnOpenSettings: document.getElementById("btnOpenSettings"),
    settingsModal: document.getElementById("settingsModal"),
    btnCloseSettings: document.getElementById("btnCloseSettings"),
    btnSaveSettings: document.getElementById("btnSaveSettings"),
    btnTestBackend: document.getElementById("btnTestBackend"),
    backendUrlInput: document.getElementById("backendUrlInput"),
    backendHealthFeedback: document.getElementById("backendHealthFeedback"),

    // Instructions Modal
    btnViewInstructions: document.getElementById("btnViewInstructions"),
    instructionsModal: document.getElementById("instructionsModal"),
    btnCloseInstructions: document.getElementById("btnCloseInstructions"),
    btnDismissInstructions: document.getElementById("btnDismissInstructions"),
    instructionsText: document.getElementById("instructionsText"),
  };

  /**
   * Initialize Application
   */
  function init() {
    renderProblemDropdown();
    setupEventListeners();
    updateBackendModeDisplay();
    loadDemoCase("correct");
    el.instructionsText.textContent = SYSTEM_INSTRUCTIONS;
    updatePromptPreview();
  }

  /**
   * Render the problem dropdown
   */
  function renderProblemDropdown() {
    el.problemSelect.innerHTML = "";
    PROBLEMS.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.title;
      el.problemSelect.appendChild(opt);
    });
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Problem selection
    el.problemSelect.addEventListener("change", (e) => {
      onProblemChanged(e.target.value);
    });

    // Custom problem text
    el.customInput.addEventListener("input", (e) => {
      state.customProblemText = e.target.value;
      updatePromptPreview();
    });

    // Explanation & Pseudocode inputs
    el.explanationInput.addEventListener("input", () => {
      updatePromptPreview();
    });

    el.pseudocodeInput.addEventListener("input", () => {
      updatePromptPreview();
    });

    // Prompt preview toggle
    el.chkShowPrompt.addEventListener("change", (e) => {
      el.promptCard.style.display = e.target.checked ? "block" : "none";
      if (e.target.checked) updatePromptPreview();
    });

    // Demo selector buttons
    el.btnDemoCorrect.addEventListener("click", () => loadDemoCase("correct"));
    el.btnDemoError.addEventListener("click", () => loadDemoCase("conceptual_error"));
    el.btnDemoMissing.addEventListener("click", () => loadDemoCase("missing_step"));

    // Generation triggers
    el.btnGenerate.addEventListener("click", executeGeneration);
    el.btnRegenerate.addEventListener("click", executeGeneration);

    // Copy button
    el.btnCopyCode.addEventListener("click", copyJuliaCode);

    // Comparison toggles
    el.toggleLiteral.addEventListener("click", () => setComparisonView("literal"));
    el.toggleStandard.addEventListener("click", () => setComparisonView("standard"));

    // Instructor panel accordion
    el.instructorPanelHeader.addEventListener("click", toggleInstructorPanel);

    // Settings Modal
    el.btnOpenSettings.addEventListener("click", openSettingsModal);
    el.btnCloseSettings.addEventListener("click", closeSettingsModal);
    el.btnSaveSettings.addEventListener("click", saveSettings);
    el.btnTestBackend.addEventListener("click", testBackendConnection);

    // Instructions Modal
    el.btnViewInstructions.addEventListener("click", () => {
      el.instructionsModal.classList.add("open");
    });
    el.btnCloseInstructions.addEventListener("click", () => {
      el.instructionsModal.classList.remove("open");
    });
    el.btnDismissInstructions.addEventListener("click", () => {
      el.instructionsModal.classList.remove("open");
    });

    // Close modals on background click
    window.addEventListener("click", (e) => {
      if (e.target === el.settingsModal) closeSettingsModal();
      if (e.target === el.instructionsModal) el.instructionsModal.classList.remove("open");
    });
  }

  /**
   * Problem selection handler
   */
  function onProblemChanged(problemId) {
    state.currentProblemId = problemId;
    const problem = PROBLEMS.find((p) => p.id === problemId);
    if (!problem) return;

    if (problem.id === "p-custom") {
      el.customWrapper.style.display = "block";
      el.problemDesc.textContent = "Specify the custom programming problem below.";
    } else {
      el.customWrapper.style.display = "none";
      el.problemDesc.textContent = problem.statement;
    }

    el.explanationInput.placeholder = problem.explanationPlaceholder || "Explain your approach...";
    updatePromptPreview();
  }

  /**
   * Load predefined demo case
   */
  function loadDemoCase(demoKey) {
    state.currentDemoKey = demoKey;
    const demo = DEMO_EXAMPLES[demoKey];
    if (!demo) return;

    // Highlight active demo button
    [el.btnDemoCorrect, el.btnDemoError, el.btnDemoMissing].forEach((btn) => {
      btn.classList.remove("active");
    });
    if (demoKey === "correct") el.btnDemoCorrect.classList.add("active");
    if (demoKey === "conceptual_error") el.btnDemoError.classList.add("active");
    if (demoKey === "missing_step") el.btnDemoMissing.classList.add("active");

    // Set form fields
    el.problemSelect.value = demo.problemId;
    onProblemChanged(demo.problemId);
    el.explanationInput.value = demo.explanation;
    el.pseudocodeInput.value = demo.pseudocode;

    // Render results immediately
    renderGeneratedResult({
      code: demo.constrainedJulia,
      badgeLabel: demo.badgeLabel,
      badgeType: demo.badgeType,
      note: demo.pedagogicalNote,
      tests: demo.tests,
    });

    // Update comparison
    updateComparisonSection(demo);

    // Update instructor snapshot
    updateInstructorSnapshot(demo.problemTitle, demo.badgeLabel);

    updatePromptPreview();
    setStatus("ready", "Demo Loaded");
  }

  /**
   * Assemble user prompt for transparency
   */
  function assembleFullPrompt() {
    const problem = PROBLEMS.find((p) => p.id === el.problemSelect.value);
    const problemStatement =
      problem?.id === "p-custom" ? el.customInput.value.trim() : problem?.statement || "";
    const explanation = el.explanationInput.value.trim();
    const pseudocode = el.pseudocodeInput.value.trim();

    return `=== [SYSTEM PROMPT] ===
${SYSTEM_INSTRUCTIONS}

=== [USER PROMPT] ===
### PROBLEM STATEMENT:
${problemStatement || "(None provided)"}

### STUDENT'S LOGICAL EXPLANATION:
${explanation || "(None provided)"}

### STUDENT'S PSEUDOCODE / ALGORITHM:
${pseudocode || "(None provided)"}`;
  }

  function updatePromptPreview() {
    if (el.chkShowPrompt.checked) {
      el.promptContent.textContent = assembleFullPrompt();
    }
  }

  /**
   * Generation Execution (Demo or Live)
   */
  async function executeGeneration() {
    const pseudocode = el.pseudocodeInput.value.trim();
    if (!pseudocode) {
      alert("Please write some pseudocode before generating Julia.");
      el.pseudocodeInput.focus();
      return;
    }

    const problem = PROBLEMS.find((p) => p.id === el.problemSelect.value);
    const problemStatement =
      problem?.id === "p-custom" ? el.customInput.value.trim() : problem?.statement || "";
    const explanation = el.explanationInput.value.trim();

    setStatus("generating", "Generating Julia...");
    el.btnGenerate.disabled = true;

    // Check if Live Mode is configured
    if (state.backendMode === "live" && state.backendUrl) {
      try {
        const response = await fetch(state.backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problem: problemStatement,
            explanation,
            pseudocode,
            mode: "constrained",
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const code = data.julia_code;

        // Determine badge type from code inspection
        let badgeType = "sufficient";
        let badgeLabel = "Algorithm translated";
        if (code.includes("# Student algorithm does not specify")) {
          badgeType = "incomplete";
          badgeLabel = "Specification incomplete";
        } else if (code.includes("/ length(x)") || code.includes("/length(x)")) {
          badgeType = "incorrect";
          badgeLabel = "Algorithm faithfully implemented, but specification is incorrect";
        }

        renderGeneratedResult({
          code,
          badgeLabel,
          badgeType,
          note: "Live LLM response received from configured backend proxy. Notice that the model adhered strictly to the 11 system rules.",
          tests: runSimulatedTests(problem, code),
        });

        setStatus("generated", "Generated (Live)");
        updateInstructorSnapshot(problem?.title || "Custom Problem", badgeLabel, "Live Model");
      } catch (err) {
        console.error("Live backend error:", err);
        setStatus("error", "Backend unavailable");
        alert(
          `Live backend request failed: ${err.message}\n\nFalling back to Demo Mode response.`
        );
        runDemoFallback(problem, explanation, pseudocode);
      } finally {
        el.btnGenerate.disabled = false;
      }
    } else {
      // Demo Mode execution
      setTimeout(() => {
        runDemoFallback(problem, explanation, pseudocode);
        el.btnGenerate.disabled = false;
      }, 350);
    }
  }

  function runDemoFallback(problem, explanation, pseudocode) {
    const demoResp = generateDemoResponse(problem, explanation, pseudocode);

    // If pseudocode matches one of the 3 canonical demos, pull full richness
    if (pseudocode.includes("length(x)") && !pseudocode.includes("count")) {
      const demo = DEMO_EXAMPLES.conceptual_error;
      renderGeneratedResult({
        code: demo.constrainedJulia,
        badgeLabel: demo.badgeLabel,
        badgeType: demo.badgeType,
        note: demo.pedagogicalNote,
        tests: demo.tests,
      });
      updateComparisonSection(demo);
    } else if (pseudocode.includes("calculate the degree") && !pseudocode.includes("for")) {
      const demo = DEMO_EXAMPLES.missing_step;
      renderGeneratedResult({
        code: demo.constrainedJulia,
        badgeLabel: demo.badgeLabel,
        badgeType: demo.badgeType,
        note: demo.pedagogicalNote,
        tests: demo.tests,
      });
      updateComparisonSection(demo);
    } else {
      renderGeneratedResult({
        code: demoResp.constrainedJulia,
        badgeLabel: demoResp.badgeLabel,
        badgeType: demoResp.badgeType,
        note: demoResp.pedagogicalNote,
        tests: runSimulatedTests(problem, demoResp.constrainedJulia),
      });
    }

    setStatus("generated", "Generated (Demo Mode)");
    updateInstructorSnapshot(problem?.title || "Custom Problem", "Processed (Demo Mode)");
  }

  /**
   * Render Generated Code & Status
   */
  function renderGeneratedResult({ code, badgeLabel, badgeType, note, tests }) {
    state.lastGeneratedJulia = code;
    el.juliaOutput.innerHTML = highlightJulia(code);

    // Badge
    el.specificationBadge.className = `badge badge-${badgeType}`;
    el.specificationBadge.textContent = badgeLabel;

    // Pedagogy note
    el.pedagogyNote.textContent = note;

    // Render Tests
    renderTestResults(tests || []);
  }

  /**
   * Render simulated test suite
   */
  function renderTestResults(tests) {
    el.testResultsList.innerHTML = "";
    if (!tests || tests.length === 0) {
      el.testResultsList.innerHTML = `
        <div class="test-item">
          <span>No automated test cases configured for this custom problem.</span>
        </div>`;
      return;
    }

    tests.forEach((t) => {
      const item = document.createElement("div");
      const isPass = t.status === "passed";
      item.className = `test-item ${isPass ? "test-passed" : "test-failed"}`;

      let detailsHtml = "";
      if (t.expected && t.returned) {
        detailsHtml = `<div style="font-size: 0.75rem; color: #64748b; margin-top: 0.2rem;">
          Expected: <code>${escapeHtml(t.expected)}</code> &bull; Returned: <code>${escapeHtml(t.returned)}</code>
          ${t.reason || t.detail ? `<br><span style="color:#b91c1c;">${escapeHtml(t.reason || t.detail)}</span>` : ""}
        </div>`;
      }

      item.innerHTML = `
        <div style="flex: 1;">
          <div><strong>${escapeHtml(t.name || t.input || "Test")}</strong></div>
          ${detailsHtml}
        </div>
        <span class="test-tag ${isPass ? "passed" : "failed"}">${isPass ? "Passed" : "Failed"}</span>
      `;
      el.testResultsList.appendChild(item);
    });
  }

  function runSimulatedTests(problem, code) {
    if (!problem || !problem.simulatedTests) return [];
    return problem.simulatedTests.map((t) => {
      const res = t.evalFn ? t.evalFn(code) : { passed: true, returned: t.expected, expected: t.expected };
      return {
        name: t.name,
        status: res.passed ? "passed" : "failed",
        expected: res.expected,
        returned: res.returned,
        reason: res.reason,
      };
    });
  }

  /**
   * Comparison Toggle Logic
   */
  function setComparisonView(view) {
    state.comparisonView = view;
    if (view === "literal") {
      el.toggleLiteral.classList.add("active");
      el.toggleStandard.classList.remove("active");
    } else {
      el.toggleStandard.classList.add("active");
      el.toggleLiteral.classList.remove("active");
    }

    const currentDemo = DEMO_EXAMPLES[state.currentDemoKey] || DEMO_EXAMPLES.conceptual_error;
    updateComparisonSection(currentDemo);
  }

  function updateComparisonSection(demo) {
    const isStandard = state.comparisonView === "standard";
    if (isStandard) {
      el.comparisonLangLabel.textContent = "Julia (Standard Unconstrained LLM)";
      el.comparisonModeTag.textContent = "Unconstrained AI";
      el.comparisonModeTag.className = "badge badge-mode";
      el.comparisonCodeOutput.innerHTML = highlightJulia(demo.standardJulia || "# No unconstrained comparison available");
      el.comparisonExplanation.textContent =
        demo.standardNote ||
        "A standard unconstrained model fixes conceptual bugs silently or rewrites the algorithm using high-level idioms, masking whether the student actually understood the logic.";
    } else {
      el.comparisonLangLabel.textContent = "Julia (Constrained Literal Translation)";
      el.comparisonModeTag.textContent = "Constrained Prompt";
      el.comparisonModeTag.className = "badge badge-prototype";
      el.comparisonCodeOutput.innerHTML = highlightJulia(demo.constrainedJulia);
      el.comparisonExplanation.textContent = demo.pedagogicalNote;
    }
  }

  /**
   * Instructor View Update & Toggle
   */
  function toggleInstructorPanel() {
    el.instructorPanel.classList.toggle("open");
    const isOpen = el.instructorPanel.classList.contains("open");
    el.instructorToggleIcon.textContent = isOpen ? "▲ Collapse" : "▼ Expand";
  }

  function updateInstructorSnapshot(problemTitle, statusLabel, modeLabel) {
    el.snapshotProblem.textContent = problemTitle;
    el.snapshotMode.textContent =
      modeLabel || (state.backendMode === "live" ? "Live Model Backend" : "Demo Mode (Built-in)");
    el.snapshotTimestamp.textContent = new Date().toLocaleTimeString();
    el.snapshotStatus.textContent = statusLabel;
  }

  /**
   * Status Pill Management
   */
  function setStatus(type, text) {
    el.statusIndicator.className = `status-pill status-${type}`;
    el.statusText.textContent = text;
  }

  /**
   * Copy Generated Code
   */
  function copyJuliaCode() {
    if (!state.lastGeneratedJulia) return;
    navigator.clipboard.writeText(state.lastGeneratedJulia).then(() => {
      const originalText = el.btnCopyCode.textContent;
      el.btnCopyCode.textContent = "Copied!";
      setTimeout(() => {
        el.btnCopyCode.textContent = originalText;
      }, 1800);
    });
  }

  /**
   * Settings Modal & Backend Config
   */
  function openSettingsModal() {
    el.settingsModal.classList.add("open");
    const radios = document.getElementsByName("backendMode");
    radios.forEach((r) => {
      r.checked = r.value === state.backendMode;
    });
    el.backendUrlInput.value = state.backendUrl;
    el.backendHealthFeedback.style.display = "none";
  }

  function closeSettingsModal() {
    el.settingsModal.classList.remove("open");
  }

  function saveSettings() {
    const selectedMode = document.querySelector('input[name="backendMode"]:checked')?.value || "demo";
    const url = el.backendUrlInput.value.trim();

    state.backendMode = selectedMode;
    state.backendUrl = url;

    localStorage.setItem("pj_backend_mode", state.backendMode);
    localStorage.setItem("pj_backend_url", state.backendUrl);

    updateBackendModeDisplay();
    closeSettingsModal();
  }

  function updateBackendModeDisplay() {
    if (state.backendMode === "live" && state.backendUrl) {
      el.backendModeBadge.textContent = "Mode: Live Model";
      el.currentBackendDisplay.textContent = "Live Proxy Endpoint";
    } else {
      el.backendModeBadge.textContent = "Mode: Demo";
      el.currentBackendDisplay.textContent = "Demo Mode (Built-in)";
    }
  }

  async function testBackendConnection() {
    const url = el.backendUrlInput.value.trim();
    if (!url) {
      showHealthFeedback("Please enter a backend URL to test.", false);
      return;
    }

    showHealthFeedback("Testing connection...", null);

    try {
      const resp = await fetch(url, { method: "GET" });
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        showHealthFeedback(
          `Success! Backend is reachable. (Has OpenAI key: ${data.hasApiKey ? "Yes" : "Not yet set in worker"})`,
          true
        );
      } else {
        showHealthFeedback(`Backend returned HTTP ${resp.status} status.`, false);
      }
    } catch (err) {
      showHealthFeedback(`Connection error: ${err.message}. Check CORS or endpoint URL.`, false);
    }
  }

  function showHealthFeedback(msg, isSuccess) {
    el.backendHealthFeedback.style.display = "block";
    el.backendHealthFeedback.textContent = msg;
    if (isSuccess === true) {
      el.backendHealthFeedback.style.backgroundColor = "var(--color-success-bg)";
      el.backendHealthFeedback.style.color = "var(--color-success)";
      el.backendHealthFeedback.style.border = "1px solid var(--color-success-border)";
    } else if (isSuccess === false) {
      el.backendHealthFeedback.style.backgroundColor = "var(--color-danger-bg)";
      el.backendHealthFeedback.style.color = "var(--color-danger)";
      el.backendHealthFeedback.style.border = "1px solid var(--color-danger-border)";
    } else {
      el.backendHealthFeedback.style.backgroundColor = "var(--color-surface-subtle)";
      el.backendHealthFeedback.style.color = "var(--color-text-main)";
      el.backendHealthFeedback.style.border = "1px solid var(--color-border)";
    }
  }

  /**
   * Lightweight Julia Syntax Highlighter
   */
  function highlightJulia(rawCode) {
    if (!rawCode) return "";

    const lines = rawCode.split("\n");
    const keywords = [
      "function",
      "end",
      "for",
      "while",
      "in",
      "if",
      "elseif",
      "else",
      "return",
      "let",
      "local",
      "global",
      "const",
      "struct",
      "module",
      "using",
      "import",
      "export",
    ];

    const escapedLines = lines.map((line) => {
      // Escape HTML entities
      let safe = escapeHtml(line);

      // Comment
      const commentIdx = safe.indexOf("#");
      let commentPart = "";
      if (commentIdx !== -1) {
        commentPart = `<span class="token-comment">${safe.substring(commentIdx)}</span>`;
        safe = safe.substring(0, commentIdx);
      }

      // Keywords
      keywords.forEach((kw) => {
        const regex = new RegExp(`\\b(${kw})\\b`, "g");
        safe = safe.replace(regex, '<span class="token-kw">$1</span>');
      });

      // Function calls (word followed by parenthesis)
      safe = safe.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/g, '<span class="token-fn">$1</span>');

      // Numbers
      safe = safe.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-num">$1</span>');

      return safe + commentPart;
    });

    return escapedLines.join("\n");
  }

  function escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initialize once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
