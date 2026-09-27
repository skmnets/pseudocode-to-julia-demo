/**
 * Demo Mode Examples and Predefined Responses
 * Supports zero-API-key instant demonstration on GitHub Pages.
 */

const DEMO_EXAMPLES = {
  correct: {
    id: "demo-correct",
    name: "Demo 1: Correct Algorithm",
    subtitle: "Algorithm specification is precise & complete",
    problemId: "p1-positive-mean",
    problemTitle: "Problem 1 — Positive Mean",
    problemText: "Write a function that receives a vector of numbers and returns the mean of only the positive entries.",
    explanation: "I will iterate through each element in the input vector. If the element is strictly positive, I'll add it to a running accumulator and increment a positive element count. Finally, I will return the accumulated sum divided by the positive element count.",
    pseudocode: `function positive_mean(x)
    set total equal to 0
    set count equal to 0

    for every value in x
        if value is greater than 0
            add value to total
            add 1 to count
        end
    end

    if count == 0
        return 0.0
    end

    return total / count
end`,
    badgeType: "sufficient",
    badgeLabel: "Algorithm specification sufficient",
    pedagogicalNote: "The student's algorithm explicitly tracks both the sum of positive values and the count of positive values. The LLM translates this directly into valid Julia. The resulting code passes all test cases because the student's specification was conceptually correct.",
    constrainedJulia: `function positive_mean(x)
    total = 0.0
    count = 0

    for value in x
        if value > 0
            total += value
            count += 1
        end
    end

    if count == 0
        return 0.0
    end

    return total / count
end`,
    standardJulia: `function positive_mean(x)
    positives = filter(v -> v > 0, x)
    isempty(positives) && return 0.0
    return sum(positives) / length(positives)
end`,
    tests: [
      { name: "positive_mean([2.0, 4.0, 6.0])", status: "passed", expected: "4.0", returned: "4.0" },
      { name: "positive_mean([-5.0, 10.0, -2.0, 20.0])", status: "passed", expected: "15.0", returned: "15.0" },
      { name: "positive_mean([-1.0, -2.0])", status: "passed", expected: "0.0", returned: "0.0" }
    ]
  },

  conceptual_error: {
    id: "demo-conceptual-error",
    name: "Demo 2: Conceptual Error",
    subtitle: "Divides by length(x) instead of positive count",
    problemId: "p1-positive-mean",
    problemTitle: "Problem 1 — Positive Mean",
    problemText: "Write a function that receives a vector of numbers and returns the mean of only the positive entries.",
    explanation: "I will sum all positive numbers in the vector and then divide the sum by the length of the vector to get the average.",
    pseudocode: `function positive_mean(x)
    total = 0

    for value in x
        if value > 0
            total = total + value
        end
    end

    return total / length(x)
end`,
    badgeType: "incorrect",
    badgeLabel: "Algorithm faithfully implemented, but specification is incorrect",
    pedagogicalNote: "The implementation is syntactically valid, but the student's algorithm contains a conceptual mistake (dividing by the total length of the vector rather than the number of positive items). The AI preserves that mistake rather than solving the problem for the student.",
    constrainedJulia: `function positive_mean(x)
    total = 0

    for value in x
        if value > 0
            total = total + value
        end
    end

    return total / length(x)
end`,
    standardJulia: `function positive_mean(x)
    # Standard LLM silently identifies the bug and replaces length(x) with count(>0, x):
    positives = filter(v -> v > 0, x)
    isempty(positives) && return 0.0
    return sum(positives) / length(positives)
end`,
    standardNote: "An unconstrained model silently 'fixes' the denominator to count positive elements or substitutes higher-level idiomatic library functions. This rewards the student with a working program despite their fundamental conceptual misunderstanding.",
    tests: [
      { name: "positive_mean([2.0, 4.0]) [all positive]", status: "passed", expected: "3.0", returned: "3.0" },
      { name: "positive_mean([2.0, -10.0, 4.0])", status: "failed", expected: "3.0", returned: "2.0", detail: "Expected 6.0 / 2 = 3.0, but returned 6.0 / 3 = 2.0" },
      { name: "positive_mean([-5.0, 10.0, -2.0, 20.0])", status: "failed", expected: "15.0", returned: "7.5", detail: "Expected 30.0 / 2 = 15.0, but returned 30.0 / 4 = 7.5" }
    ]
  },

  missing_step: {
    id: "demo-missing-step",
    name: "Demo 3: Missing Step",
    subtitle: "Specifies goal without stating algorithmic steps",
    problemId: "p4-adjacency-degree",
    problemTitle: "Problem 4 — Adjacency Degree",
    problemText: "Given an adjacency matrix A, return a vector containing the degree of every node.",
    explanation: "I need to take the adjacency matrix and return how many connections each node has.",
    pseudocode: `function node_degrees(A)
    calculate the degree of every node
    return degrees
end`,
    badgeType: "incomplete",
    badgeLabel: "Specification incomplete",
    pedagogicalNote: "The student stated the high-level intent without providing the mechanical steps (e.g. summing row elements or counting non-zero entries). Under rule #8, the constrained model refuses to invent an algorithm and outputs an explicit comment identifying the omission.",
    constrainedJulia: `function node_degrees(A)
    # Student algorithm does not specify how this value should be computed.
    degrees = # Student algorithm does not specify how this value should be computed.

    return degrees
end`,
    standardJulia: `function node_degrees(A)
    # Standard LLM invents the entire algorithm using LinearAlgebra / sum dims:
    return vec(sum(A, dims=2))
end`,
    standardNote: "An unconstrained model hallucinates or writes the entire graph degree calculation `vec(sum(A, dims=2))` on behalf of the student, completely defeating computational assessment.",
    tests: [
      { name: "node_degrees([0 1 1; 1 0 1; 1 1 0])", status: "failed", expected: "[2, 2, 2]", returned: "SyntaxError / Undefined", detail: "Line 3: incomplete right-hand expression from missing specification." }
    ]
  }
};

/**
 * Fallback generator for demo mode when a student types a custom algorithm
 * without calling a live LLM API.
 */
function generateDemoResponse(problem, explanation, pseudocode) {
  // Check if it matches known demo signatures
  if (pseudocode.includes("length(x)") && !pseudocode.includes("count")) {
    return DEMO_EXAMPLES.conceptual_error;
  }
  if (pseudocode.includes("calculate the degree") && !pseudocode.includes("for")) {
    return DEMO_EXAMPLES.missing_step;
  }

  // Generic faithful translation mockup for demo purposes
  const cleanLines = pseudocode
    .split("\n")
    .map(line => {
      let l = line;
      l = l.replace(/\bset\s+([a-zA-Z0-9_]+)\s+equal\s+to\s+/gi, "$1 = ");
      l = l.replace(/\bset\s+([a-zA-Z0-9_]+)\s*=\s*/gi, "$1 = ");
      l = l.replace(/\badd\s+([a-zA-Z0-9_.]+)\s+to\s+([a-zA-Z0-9_]+)/gi, "$2 += $1");
      l = l.replace(/\bfor\s+every\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_]+)/gi, "for $1 in $2");
      l = l.replace(/\bis\s+greater\s+than\s+/gi, " > ");
      l = l.replace(/\bis\s+less\s+than\s+/gi, " < ");
      l = l.replace(/\bis\s+equal\s+to\s+/gi, " == ");
      return l;
    })
    .join("\n");

  return {
    badgeType: "sufficient",
    badgeLabel: "Algorithm specification sufficient (Demo Mode)",
    pedagogicalNote: "Generated in Demo Mode using rule-based literal pseudocode conversion.",
    constrainedJulia: cleanLines,
    tests: [
      { name: "Syntax Verification", status: "passed", expected: "Valid Julia syntax", returned: "Parses successfully" },
      { name: "Algorithmic Fidelity", status: "passed", expected: "No unprompted additions", returned: "Faithful translation" }
    ]
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEMO_EXAMPLES, generateDemoResponse };
}
