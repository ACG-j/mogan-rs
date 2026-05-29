export type CycleRule = {
  readonly id: string;
  readonly items: readonly string[];
};

export const symbolCycleRules: readonly CycleRule[] = [
  { id: "latin-a", items: ["a", "\\alpha", "\\aleph"] },
  { id: "latin-b", items: ["b", "\\beta", "\\flat"] },
  { id: "latin-c", items: ["c", "\\varsigma", "\\sigma"] },
  { id: "latin-d", items: ["d", "\\delta", "\\mathrm{d}", "\\partial"] },
  { id: "latin-e", items: ["e", "\\varepsilon", "\\mathrm{e}", "\\epsilon"] },
  { id: "latin-f", items: ["f", "\\varphi", "\\phi"] },
  { id: "latin-g", items: ["g", "\\gamma"] },
  { id: "latin-h", items: ["h", "\\eta", "\\hbar"] },
  { id: "latin-i", items: ["i", "\\iota", "\\mathrm{i}", "\\imath"] },
  { id: "latin-j", items: ["j", "\\theta", "\\jmath", "\\vartheta"] },
  { id: "latin-k", items: ["k", "\\kappa", "\\varkappa"] },
  { id: "latin-l", items: ["l", "\\lambda", "\\ell"] },
  { id: "latin-m", items: ["m", "\\mu"] },
  { id: "latin-n", items: ["n", "\\nu", "\\nabla"] },
  { id: "latin-o", items: ["o", "\\omicron"] },
  { id: "latin-p", items: ["p", "\\pi", "\\varpi"] },
  { id: "latin-q", items: ["q", "\\chi"] },
  { id: "latin-r", items: ["r", "\\rho", "\\varrho"] },
  { id: "latin-s", items: ["s", "\\sigma", "\\varsigma"] },
  { id: "latin-t", items: ["t", "\\tau"] },
  { id: "latin-u", items: ["u", "\\upsilon"] },
  { id: "latin-v", items: ["v", "\\phi", "\\varphi"] },
  { id: "latin-w", items: ["w", "\\omega", "\\mho"] },
  { id: "latin-x", items: ["x", "\\xi"] },
  { id: "latin-y", items: ["y", "\\psi"] },
  { id: "latin-z", items: ["z", "\\zeta"] },
  { id: "capital-a", items: ["A", "\\Alpha", "\\forall", "\\aleph"] },
  { id: "capital-d", items: ["D", "\\Delta", "\\nabla"] },
  { id: "capital-e", items: ["E", "\\Epsilon", "\\exists"] },
  { id: "capital-g", items: ["G", "\\Gamma"] },
  { id: "capital-i", items: ["I", "\\int", "\\iint", "\\iiint"] },
  { id: "capital-l", items: ["L", "\\Lambda"] },
  { id: "capital-o", items: ["O", "\\Omicron"] },
  { id: "capital-p", items: ["P", "\\Pi", "\\prod"] },
  { id: "capital-s", items: ["S", "\\Sigma", "\\sum"] },
  { id: "capital-v", items: ["V", "\\Phi", "\\nabla"] },
  { id: "capital-w", items: ["W", "\\Omega"] },
  { id: "capital-x", items: ["X", "\\Xi"] },
  { id: "capital-y", items: ["Y", "\\Psi"] },
  { id: "less", items: ["<", "\\le", "\\subset", "\\in", "\\langle"] },
  { id: "greater", items: [">", "\\ge", "\\supset", "\\ni", "\\rangle"] },
  { id: "equals", items: ["=", "\\equiv", "\\approx", "\\cong"] },
  { id: "operators", items: ["\\sum", "\\prod", "\\int", "\\lim"] },
];

export function cycleLatexSymbol(latex: string): string {
  const trimmed = latex.trim();

  for (const rule of symbolCycleRules) {
    const index = rule.items.indexOf(trimmed);
    if (index >= 0) {
      return rule.items[(index + 1) % rule.items.length];
    }
  }

  return trimmed;
}
