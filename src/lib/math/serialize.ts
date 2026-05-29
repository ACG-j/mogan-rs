import { escapeTypstText, latexToTypstMath } from "./latex";
import { emptyMath, normalizeMathNode, row, symbol, type MathNode } from "./ast";

export type MathAttrs = {
  readonly latex: string;
  readonly mathAst?: MathNode;
};

export function mathAttrsFromAst(mathAst: MathNode): MathAttrs {
  return {
    latex: mathToLatex(mathAst),
    mathAst,
  };
}

export function mathNodeFromAttrs(attrs: unknown): MathNode | undefined {
  if (!attrs || typeof attrs !== "object") return undefined;
  const source = attrs as Record<string, unknown>;
  return normalizeMathNode(source.mathAst);
}

export function mathToLatex(node: MathNode): string {
  switch (node.type) {
    case "row":
      return joinLatexParts(node.children.map(mathToLatex));
    case "symbol":
      return node.value;
    case "frac":
      return `\\frac{${mathToLatex(node.numerator)}}{${mathToLatex(node.denominator)}}`;
    case "sqrt":
      return node.index
        ? `\\sqrt[${mathToLatex(node.index)}]{${mathToLatex(node.body)}}`
        : `\\sqrt{${mathToLatex(node.body)}}`;
    case "script": {
      const sub = node.sub ? `_{${mathToLatex(node.sub)}}` : "";
      const sup = node.sup ? `^{${mathToLatex(node.sup)}}` : "";
      return `${wrapScriptBase(node.base)}${sub}${sup}`;
    }
    case "neg":
      return `\\neg ${mathToLatex(node.body)}`;
    case "matrix":
      return `\\begin{pmatrix}${node.rows
        .map((matrixRow) => matrixRow.map(mathToLatex).join("&"))
        .join("\\\\")}\\end{pmatrix}`;
    case "cases":
      return `\\begin{cases}${node.rows
        .map((caseRow) => `${mathToLatex(caseRow.body)} & ${mathToLatex(caseRow.condition)}`)
        .join("\\\\")}\\end{cases}`;
    case "placeholder":
      return node.label ?? "\\square";
  }
}

export function mathToTypst(node: MathNode): string {
  switch (node.type) {
    case "row":
      return joinTypstParts(node.children.map(mathToTypst));
    case "symbol":
      return latexToTypstMath(node.value);
    case "frac":
      return `frac(${mathToTypst(node.numerator)}, ${mathToTypst(node.denominator)})`;
    case "sqrt":
      return node.index
        ? `root(${mathToTypst(node.index)}, ${mathToTypst(node.body)})`
        : `sqrt(${mathToTypst(node.body)})`;
    case "script": {
      const base = mathToTypst(node.base);
      const sub = node.sub ? `_${wrapTypstScript(mathToTypst(node.sub))}` : "";
      const sup = node.sup ? `^${wrapTypstScript(mathToTypst(node.sup))}` : "";
      return `${base}${sub}${sup}`;
    }
    case "neg":
      return `not ${mathToTypst(node.body)}`;
    case "matrix":
      return `mat(${node.rows
        .map((matrixRow) => matrixRow.map(mathToTypst).join(", "))
        .join("; ")})`;
    case "cases":
      return `cases(${node.rows
        .map((caseRow) => `${mathToTypst(caseRow.body)} if ${mathToTypst(caseRow.condition)}`)
        .join(", ")})`;
    case "placeholder":
      return escapeTypstText(node.label ?? "□");
  }
}

export function mathFromPlainSymbol(input: string): MathNode {
  return symbol(input);
}

export function fallbackMathFromLatex(latex: string): MathNode {
  const trimmed = latex.trim();
  if (!trimmed) return emptyMath;
  return row([symbol(trimmed)]);
}

function wrapScriptBase(node: MathNode): string {
  const latex = mathToLatex(node);
  return node.type === "symbol" ? latex : `{${latex}}`;
}

function wrapTypstScript(value: string): string {
  return /^[a-zA-Z0-9]+$/.test(value) ? value : `(${value})`;
}

function joinLatexParts(parts: readonly string[]): string {
  return parts.reduce((result, part) => {
    if (!result) return part;
    return needsLatexSeparator(result, part) ? `${result} ${part}` : `${result}${part}`;
  }, "");
}

function joinTypstParts(parts: readonly string[]): string {
  return parts.reduce((result, part) => {
    if (!result) return part;
    return needsTypstSeparator(result, part) ? `${result} ${part}` : `${result}${part}`;
  }, "");
}

function needsLatexSeparator(left: string, right: string): boolean {
  return /\\[A-Za-z]+$/.test(left) && /^[A-Za-z\\]/.test(right);
}

function needsTypstSeparator(left: string, right: string): boolean {
  return /[A-Za-z]$/.test(left) && /^[A-Za-z]/.test(right);
}
