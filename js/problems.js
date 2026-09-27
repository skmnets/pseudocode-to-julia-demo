/**
 * Problem definitions for the Pseudocode -> Julia Educational Assessment Prototype.
 * Suitable for university-level computational reasoning demonstrations (e.g., CAP 6318).
 */

const PROBLEMS = [
  {
    id: "p1-positive-mean",
    title: "Problem 1 — Positive Mean",
    category: "Vector Processing & Filtering",
    statement: "Write a function that receives a vector of numbers and returns the mean of only the positive entries.",
    functionName: "positive_mean",
    parameters: "x",
    explanationPlaceholder: "Explain in words what the program should do before writing any Julia syntax.",
    explanationExample: "I will iterate through each element in the input vector, check if the value is strictly positive, add it to an accumulator, increment a count of positive values, and finally divide the accumulated sum by the count.",
    pseudocodePlaceholder: `function positive_mean(x)

set total equal to 0
set count equal to 0

for every value in x
    if value is greater than 0
        add value to total
        add 1 to count
    end
end

return total / count`,
    simulatedTests: [
      {
        name: "Test 1: All positive vector",
        input: "positive_mean([2.0, 4.0, 6.0])",
        expected: "4.0",
        evalFn: (code) => {
          // If code divides by length(x), it might pass here if all are positive
          return { passed: true, returned: "4.0", expected: "4.0" };
        }
      },
      {
        name: "Test 2: Mixed positive and negative entries",
        input: "positive_mean([-5.0, 10.0, -2.0, 20.0])",
        expected: "15.0",
        evalFn: (code) => {
          if (code.includes("/ length(x)") || code.includes("/length(x)")) {
            return { passed: false, returned: "7.5", expected: "15.0", reason: "Divided by total length (4) instead of positive count (2)." };
          }
          if (code.includes("# Student algorithm does not specify")) {
            return { passed: false, returned: "Error", expected: "15.0", reason: "Unspecified algorithmic step." };
          }
          return { passed: true, returned: "15.0", expected: "15.0" };
        }
      },
      {
        name: "Test 3: Negative and zero entries",
        input: "positive_mean([0.0, -3.0, 8.0])",
        expected: "8.0",
        evalFn: (code) => {
          if (code.includes("/ length(x)") || code.includes("/length(x)")) {
            return { passed: false, returned: "2.67", expected: "8.0", reason: "Divided by total length (3) instead of positive count (1)." };
          }
          return { passed: true, returned: "8.0", expected: "8.0" };
        }
      }
    ]
  },
  {
    id: "p2-maximum-value",
    title: "Problem 2 — Maximum Value",
    category: "Iteration & State Tracking",
    statement: "Write a function that finds the maximum value in a vector without calling Julia's built-in maximum function.",
    functionName: "find_max",
    parameters: "v",
    explanationPlaceholder: "Explain your approach: How do you initialize the maximum candidate, and how do you update it across iterations?",
    explanationExample: "Assume the vector has at least one element. Initialize the maximum to the first element. Iterate through the remaining elements. If any element is strictly greater than the current maximum, update the maximum to that element. Finally, return the candidate.",
    pseudocodePlaceholder: `function find_max(v)

set current_max = v[1]

for index from 2 to length(v)
    if v[index] is greater than current_max
        set current_max = v[index]
    end
end

return current_max`,
    simulatedTests: [
      {
        name: "Test 1: Unsorted positive values",
        input: "find_max([3, 11, 4, 1, 9])",
        expected: "11",
        evalFn: (code) => ({ passed: true, returned: "11", expected: "11" })
      },
      {
        name: "Test 2: All negative values",
        input: "find_max([-10, -3, -50, -2])",
        expected: "-2",
        evalFn: (code) => {
          if (code.includes("current_max = 0") || code.includes("max = 0")) {
            return { passed: false, returned: "0", expected: "-2", reason: "Initialized to 0 rather than v[1], failing on strictly negative vectors." };
          }
          return { passed: true, returned: "-2", expected: "-2" };
        }
      },
      {
        name: "Test 3: Single element vector",
        input: "find_max([42])",
        expected: "42",
        evalFn: (code) => ({ passed: true, returned: "42", expected: "42" })
      }
    ]
  },
  {
    id: "p3-normalize-vector",
    title: "Problem 3 — Normalize a Vector",
    category: "Linear Algebra & Scaling",
    statement: "Write a function that divides every element of a vector by the sum of all elements.",
    functionName: "normalize_vector",
    parameters: "v",
    explanationPlaceholder: "Explain how to compute the normalization denominator and produce the scaled output vector.",
    explanationExample: "First compute the total sum of all elements in the vector. Then construct an output vector where each element is the corresponding original element divided by that total sum.",
    pseudocodePlaceholder: `function normalize_vector(v)

total = 0
for x in v
    total = total + x
end

create result vector with same size as v
for i from 1 to length(v)
    result[i] = v[i] / total
end

return result`,
    simulatedTests: [
      {
        name: "Test 1: Standard probability mass",
        input: "normalize_vector([1.0, 2.0, 3.0, 4.0])",
        expected: "[0.1, 0.2, 0.3, 0.4]",
        evalFn: (code) => ({ passed: true, returned: "[0.1, 0.2, 0.3, 0.4]", expected: "[0.1, 0.2, 0.3, 0.4]" })
      },
      {
        name: "Test 2: Sum to 1 check",
        input: "sum(normalize_vector([5.0, 15.0, 30.0]))",
        expected: "1.0",
        evalFn: (code) => ({ passed: true, returned: "1.0", expected: "1.0" })
      }
    ]
  },
  {
    id: "p4-adjacency-degree",
    title: "Problem 4 — Adjacency Degree",
    category: "Network Science & Graph Matrices",
    statement: "Given an adjacency matrix A, return a vector containing the degree of every node.",
    functionName: "node_degrees",
    parameters: "A",
    explanationPlaceholder: "Explain how node degrees relate to rows or columns of the adjacency matrix.",
    explanationExample: "In an adjacency matrix where A[i, j] indicates a link from node i to j, the degree of node i can be computed by summing row i across all columns j.",
    pseudocodePlaceholder: `function node_degrees(A)

n = number of rows in A
degrees = array of zeros of length n

for i from 1 to n
    row_sum = 0
    for j from 1 to n
        row_sum = row_sum + A[i, j]
    end
    degrees[i] = row_sum
end

return degrees`,
    simulatedTests: [
      {
        name: "Test 1: 3-node triangle graph",
        input: "node_degrees([0 1 1; 1 0 1; 1 1 0])",
        expected: "[2, 2, 2]",
        evalFn: (code) => {
          if (code.includes("# Student algorithm does not specify")) {
            return { passed: false, returned: "Undefined", expected: "[2, 2, 2]", reason: "Missing calculation specification." };
          }
          return { passed: true, returned: "[2, 2, 2]", expected: "[2, 2, 2]" };
        }
      },
      {
        name: "Test 2: Star graph (center node has degree 3)",
        input: "node_degrees([0 1 1 1; 1 0 0 0; 1 0 0 0; 1 0 0 0])",
        expected: "[3, 1, 1, 1]",
        evalFn: (code) => ({ passed: true, returned: "[3, 1, 1, 1]", expected: "[3, 1, 1, 1]" })
      }
    ]
  },
  {
    id: "p5-production-network",
    title: "Problem 5 — Production Network (CAP 6318)",
    category: "Economic Networks & Leontief Systems",
    statement: "Given an input-output matrix A and a vector of final demand d, compute the production vector x satisfying x = Ax + d.",
    functionName: "compute_production",
    parameters: "A, d",
    explanationPlaceholder: "Explain your approach: How do you rearrange x = Ax + d or iteratively solve for x?",
    explanationExample: "We can rearrange x - Ax = d into (I - A)x = d. We construct the identity matrix I with the same dimensions as A, form the Leontief matrix (I - A), and solve the linear system for x using matrix division.",
    pseudocodePlaceholder: `function compute_production(A, d)

n = size of d
I = identity matrix of size n
M = I - A
x = solve linear system M * x = d

return x`,
    simulatedTests: [
      {
        name: "Test 1: 2-sector economy equilibrium",
        input: "compute_production([0.2 0.3; 0.4 0.1], [100.0, 200.0])",
        expected: "[288.14, 350.85]",
        evalFn: (code) => ({ passed: true, returned: "[288.14, 350.85]", expected: "[288.14, 350.85]" })
      },
      {
        name: "Test 2: Zero inter-industry dependency (A = 0)",
        input: "compute_production([0.0 0.0; 0.0 0.0], [50.0, 75.0])",
        expected: "[50.0, 75.0]",
        evalFn: (code) => ({ passed: true, returned: "[50.0, 75.0]", expected: "[50.0, 75.0]" })
      }
    ]
  },
  {
    id: "p-custom",
    title: "Custom Problem (Instructor Input)",
    category: "User Specified",
    statement: "",
    functionName: "custom_solution",
    parameters: "args...",
    explanationPlaceholder: "Explain the algorithmic strategy...",
    explanationExample: "Outline the step-by-step logic...",
    pseudocodePlaceholder: `function custom_solution(...)
    # Write your algorithmic steps here
end`,
    simulatedTests: []
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PROBLEMS };
}
