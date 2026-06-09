export const mathClass = {
  root: "structured-math",
  blockRoot: "structured-math--block",
  inlineRoot: "structured-math--inline",
  row: "math-row",
  structSlot: "math-struct-slot",
  leaf: "math-leaf",
  symbolLeaf: "math-symbol-leaf",
  activeLeaf: "math-leaf--active",
  cursor: "math-cursor-overlay",
  frac: "math-frac",
  fracSlot: "math-frac-slot",
  fracNumerator: "math-frac-numerator",
  fracDenominator: "math-frac-denominator",
  fracRule: "math-frac-rule",
  sqrt: "math-sqrt",
  sqrtIndex: "math-sqrt-index",
  sqrtRadical: "math-sqrt-radical",
  sqrtBody: "math-sqrt-body",
  script: "math-script",
  scriptSlots: "math-script-slots",
  scriptBase: "math-script-base",
  scriptSup: "math-script-sup",
  scriptSub: "math-script-sub",
  neg: "math-neg",
  negSign: "math-neg-sign",
  negBody: "math-neg-body",
  placeholder: "math-placeholder",
  katexFragment: "math-katex-fragment",
  katexError: "math-katex-error",
} as const;

export type CursorEdge = "start" | "end";

export function span(className: string): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = className;
  return element;
}

export function selector(className: string): string {
  return `.${className}`;
}
