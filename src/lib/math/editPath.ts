import { emptyMath, row, symbol, textMath, type MathNode } from "./ast";
import { mathToLatex } from "./serialize";

export type MathPath = readonly string[];

export function nodeAtPath(root: MathNode, path: MathPath): MathNode {
  return path.reduce((node, segment) => childAt(node, segment), root);
}

export function replaceAtPath(root: MathNode, path: MathPath, next: MathNode): MathNode {
  if (path.length === 0) return next;

  const [head, ...tail] = path;

  switch (root.type) {
    case "row": {
      const index = Number(head);
      return row(root.children.map((child, childIndex) => (childIndex === index ? replaceAtPath(child, tail, next) : child)));
    }
    case "frac":
      return {
        ...root,
        numerator: head === "numerator" ? replaceAtPath(root.numerator, tail, next) : root.numerator,
        denominator: head === "denominator" ? replaceAtPath(root.denominator, tail, next) : root.denominator,
      };
    case "sqrt":
      return {
        ...root,
        body: head === "body" ? replaceAtPath(root.body, tail, next) : root.body,
        index: head === "index" ? replaceAtPath(root.index ?? emptyMath, tail, next) : root.index,
      };
    case "script":
      return {
        ...root,
        base: head === "base" ? replaceAtPath(root.base, tail, next) : root.base,
        sub: head === "sub" ? replaceAtPath(root.sub ?? emptyMath, tail, next) : root.sub,
        sup: head === "sup" ? replaceAtPath(root.sup ?? emptyMath, tail, next) : root.sup,
      };
    case "neg":
      return {
        ...root,
        body: head === "body" ? replaceAtPath(root.body, tail, next) : root.body,
      };
    case "matrix": {
      const [rowIndex, cellIndex, ...rest] = path.map(Number);
      return {
        ...root,
        rows: root.rows.map((matrixRow, currentRow) =>
          currentRow === rowIndex
            ? matrixRow.map((cell, currentCell) =>
                currentCell === cellIndex ? replaceAtPath(cell, rest.map(String), next) : cell,
              )
            : matrixRow,
        ),
      };
    }
    case "cases": {
      const rowIndex = Number(head);
      const slot = tail[0];
      return {
        ...root,
        rows: root.rows.map((caseRow, currentRow) =>
          currentRow === rowIndex
            ? {
                body: slot === "body" ? replaceAtPath(caseRow.body, tail.slice(1), next) : caseRow.body,
                condition: slot === "condition" ? replaceAtPath(caseRow.condition, tail.slice(1), next) : caseRow.condition,
              }
            : caseRow,
        ),
      };
    }
    case "symbol":
    case "placeholder":
      return next;
  }
}

export function textToEditableMath(text: string): MathNode {
  return textMath(toLatexText(text));
}

export function mathToEditableText(node: MathNode): string {
  switch (node.type) {
    case "row":
      return node.children.map(mathToEditableText).join("");
    case "symbol":
      return toDisplayText(node.value);
    case "placeholder":
      return "";
    default:
      return mathToPlainLatex(node);
  }
}

function childAt(node: MathNode, segment: string): MathNode {
  switch (node.type) {
    case "row":
      return node.children[Number(segment)] ?? emptyMath;
    case "frac":
      return segment === "numerator" ? node.numerator : node.denominator;
    case "sqrt":
      return segment === "index" ? (node.index ?? emptyMath) : node.body;
    case "script":
      if (segment === "sub") return node.sub ?? emptyMath;
      if (segment === "sup") return node.sup ?? emptyMath;
      return node.base;
    case "neg":
      return node.body;
    case "matrix": {
      const [rowIndex, cellIndex] = segment.split(":").map(Number);
      return node.rows[rowIndex]?.[cellIndex] ?? emptyMath;
    }
    case "cases": {
      const [rowIndex, slot] = segment.split(":");
      const caseRow = node.rows[Number(rowIndex)];
      return slot === "condition" ? (caseRow?.condition ?? emptyMath) : (caseRow?.body ?? emptyMath);
    }
    case "symbol":
    case "placeholder":
      return node;
  }
}

function mathToPlainLatex(node: MathNode): string {
  return mathToLatex(node);
}

function toDisplayText(value: string): string {
  return value
    .replaceAll("\\partial", "∂")
    .replaceAll("\\cdot", "·")
    .replaceAll("\\vert", "|")
    .replaceAll("\\ln", "ln")
    .replaceAll("\\le", "≤")
    .replaceAll("\\ge", "≥")
    .replaceAll("\\alpha", "α")
    .replaceAll("\\beta", "β")
    .replaceAll("\\gamma", "γ")
    .replaceAll("\\delta", "δ")
    .replaceAll("\\pi", "π");
}

function toLatexText(value: string): string {
  return value
    .replaceAll("∂", "\\partial")
    .replaceAll("·", "\\cdot")
    .replaceAll("|", "\\vert")
    .replaceAll("≤", "\\le")
    .replaceAll("≥", "\\ge")
    .replaceAll("α", "\\alpha")
    .replaceAll("β", "\\beta")
    .replaceAll("γ", "\\gamma")
    .replaceAll("δ", "\\delta")
    .replaceAll("π", "\\pi");
}
