export type MathTemplate =
  | "fraction"
  | "sqrt"
  | "varSqrt"
  | "script"
  | "subscript"
  | "superscript"
  | "neg"
  | "matrix"
  | "cases";

export function templateLatex(template: MathTemplate): string {
  switch (template) {
    case "fraction":
      return "\\frac{1}{2}";
    case "sqrt":
      return "\\sqrt{x}";
    case "varSqrt":
      return "\\sqrt[n]{x}";
    case "script":
      return "x_i^2";
    case "subscript":
      return "x_i";
    case "superscript":
      return "x^2";
    case "neg":
      return "\\neg x";
    case "matrix":
      return "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}";
    case "cases":
      return "\\begin{cases}x & x > 0\\\\0 & x \\le 0\\end{cases}";
  }
}

export function escapeTypstText(text: string): string {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("#", "\\#");
}

export function latexToTypstMath(latex: string): string {
  return latex
    .replaceAll("\\alpha", "alpha")
    .replaceAll("\\beta", "beta")
    .replaceAll("\\gamma", "gamma")
    .replaceAll("\\delta", "delta")
    .replaceAll("\\partial", "diff")
    .replaceAll("\\le", "<=")
    .replaceAll("\\ge", ">=")
    .replaceAll("\\ne", "!=")
    .replaceAll("\\to", "->")
    .replaceAll("\\leftarrow", "<-")
    .replaceAll("\\otimes", "times.circle")
    .replaceAll("\\oplus", "plus.circle")
    .replaceAll("\\approx", "approx")
    .replaceAll("\\equiv", "equiv")
    .replaceAll("\\cong", "tilde.equiv")
    .replaceAll("\\sum", "sum")
    .replaceAll("\\prod", "product")
    .replaceAll("\\int", "integral")
    .replaceAll("\\lim", "lim");
}
