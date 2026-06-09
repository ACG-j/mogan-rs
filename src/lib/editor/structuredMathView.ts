import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import katex, { type KatexOptions } from "katex";
import { normalizeMathNode, type MathNode } from "../math/ast";
import { mathToLatex } from "../math/serialize";
import { mathToEditableText, type MathPath } from "../math/editPath";

type StructuredMathViewOptions = {
  readonly editor: Editor;
  readonly node: ProseMirrorNode;
  readonly getPos: () => number | undefined;
  readonly displayMode: boolean;
  readonly katexOptions?: KatexOptions;
};

type LeafRenderOptions = {
  readonly className?: string;
  readonly placeholder?: string;
};

type CursorEdge = "start" | "end";

export function createStructuredMathView(options: StructuredMathViewOptions): HTMLElement {
  const mathAst = normalizeMathNode(options.node.attrs.mathAst);

  if (!mathAst) {
    return createKatexFallback(options);
  }

  const wrapper = document.createElement(options.displayMode ? "div" : "span");
  wrapper.className = options.displayMode ? "structured-math structured-math--block" : "structured-math structured-math--inline";
  wrapper.tabIndex = 0;
  wrapper.dataset.type = options.displayMode ? "block-math" : "inline-math";
  wrapper.dataset.nodePos = String(options.getPos() ?? "");
  wrapper.setAttribute("data-latex", mathToLatex(mathAst));
  wrapper.appendChild(renderNode(mathAst, [], options));
  wrapper.addEventListener("mousedown", (event) => handleRootPointer(event, wrapper));
  wrapper.addEventListener("keydown", (event) => handleRootKeyDown(event, wrapper, options));
  wrapper.addEventListener("blur", () => clearCursor(wrapper));
  requestAnimationFrame(() => layoutStructuredMath(wrapper));

  return wrapper;
}

function renderNode(node: MathNode, path: MathPath, options: StructuredMathViewOptions): HTMLElement {
  switch (node.type) {
    case "row": {
      const element = span("math-row");
      node.children.forEach((child, index) => element.appendChild(renderNode(child, [...path, String(index)], options)));
      return element;
    }
    case "symbol":
      return renderLeaf(path, node, { className: "math-symbol-leaf" });
    case "placeholder":
      return renderLeaf(path, node, { className: "math-placeholder", placeholder: node.label ?? "" });
    case "frac": {
      const element = span("math-frac");
      element.appendChild(renderStructureSlot([...path, "numerator"], options, "math-frac-slot math-frac-numerator", node.numerator));
      element.appendChild(span("math-frac-rule"));
      element.appendChild(renderStructureSlot([...path, "denominator"], options, "math-frac-slot math-frac-denominator", node.denominator));
      return element;
    }
    case "sqrt": {
      const element = span("math-sqrt");
      if (node.index) {
        element.appendChild(renderStructureSlot([...path, "index"], options, "math-sqrt-index", node.index));
      }
      const radical = span("math-sqrt-radical");
      radical.textContent = "√";
      element.appendChild(radical);
      element.appendChild(renderStructureSlot([...path, "body"], options, "math-sqrt-body", node.body));
      return element;
    }
    case "script": {
      const mode = node.sup && node.sub ? "both" : node.sup ? "sup-only" : "sub-only";
      const element = span(`math-script math-script--${mode}`);
      element.appendChild(renderStructureSlot([...path, "base"], options, "math-script-base", node.base));

      const scripts = span("math-script-slots");
      if (node.sup) scripts.appendChild(renderStructureSlot([...path, "sup"], options, "math-script-sup", node.sup));
      if (node.sub) scripts.appendChild(renderStructureSlot([...path, "sub"], options, "math-script-sub", node.sub));
      element.appendChild(scripts);
      return element;
    }
    case "neg": {
      const element = span("math-neg");
      const sign = span("math-neg-sign");
      sign.textContent = "¬";
      element.appendChild(sign);
      element.appendChild(renderStructureSlot([...path, "body"], options, "math-neg-body", node.body));
      return element;
    }
    case "matrix":
    case "cases":
      return renderKatexFragment(node, options);
  }
}

function renderStructureSlot(path: MathPath, options: StructuredMathViewOptions, className: string, node: MathNode): HTMLElement {
  const element = span(`math-struct-slot ${className}`.trim());
  element.dataset.path = path.join(".");
  element.appendChild(renderNode(node, path, options));
  return element;
}

function renderLeaf(path: MathPath, node: MathNode, options: LeafRenderOptions = {}): HTMLElement {
  const element = span(`math-leaf ${options.className ?? ""}`.trim());
  const text = mathToEditableText(node);
  element.dataset.path = path.join(".");
  element.dataset.mathText = text;
  element.dataset.placeholder = options.placeholder ?? "";
  element.textContent = text;
  return element;
}

function handleRootPointer(event: MouseEvent, root: HTMLElement): void {
  const target = event.target instanceof HTMLElement ? event.target : undefined;
  const leaf = target?.closest<HTMLElement>(".math-leaf") ?? closestLeafFromPoint(root, event.clientX, event.clientY);
  if (!leaf) return;

  event.preventDefault();
  event.stopPropagation();
  focusRoot(root);
  setCursor(root, leaf, edgeFromPoint(leaf, event.clientX));
}

function handleRootKeyDown(event: KeyboardEvent, root: HTMLElement, options: StructuredMathViewOptions): void {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"].includes(event.key)) return;

  if (event.key === "Escape") {
    clearCursor(root);
    options.editor.view.focus();
    return;
  }

  const current = activeLeaf(root) ?? firstLeaf(root, "start");
  if (!current) return;

  const target =
    event.key === "ArrowLeft"
      ? relativeLeaf(root, current, -1)
      : event.key === "ArrowRight"
        ? relativeLeaf(root, current, 1)
        : verticalLeaf(current, event.key === "ArrowUp" ? "up" : "down");

  if (!target) {
    clearCursor(root);
    options.editor.view.focus();
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  setCursor(root, target, event.key === "ArrowLeft" || event.key === "ArrowUp" ? "end" : "start");
}

function focusRoot(root: HTMLElement): void {
  root.focus({ preventScroll: true });
}

function activeLeaf(root: HTMLElement): HTMLElement | undefined {
  const path = root.dataset.cursorPath;
  if (!path) return undefined;
  return editableLeaves(root).find((leaf) => leaf.dataset.path === path);
}

function setCursor(root: HTMLElement, leaf: HTMLElement, edge: CursorEdge): void {
  root.querySelectorAll(".math-leaf--active").forEach((element) => element.classList.remove("math-leaf--active"));
  leaf.classList.add("math-leaf--active");
  root.dataset.cursorPath = leaf.dataset.path ?? "";
  root.dataset.cursorEdge = edge;
  positionCursor(root, leaf, edge);
}

function clearCursor(root: HTMLElement): void {
  root.querySelectorAll(".math-leaf--active").forEach((element) => element.classList.remove("math-leaf--active"));
  root.querySelector<HTMLElement>(".math-cursor-overlay")?.remove();
  delete root.dataset.cursorPath;
  delete root.dataset.cursorEdge;
}

function positionCursor(root: HTMLElement, leaf: HTMLElement, edge: CursorEdge): void {
  let cursor = root.querySelector<HTMLElement>(".math-cursor-overlay");
  if (!cursor) {
    cursor = span("math-cursor-overlay");
    root.appendChild(cursor);
  }

  const rootBox = root.getBoundingClientRect();
  const leafBox = leaf.getBoundingClientRect();
  const x = edge === "start" ? leafBox.left - rootBox.left : leafBox.right - rootBox.left;
  cursor.style.left = `${x}px`;
  cursor.style.top = `${leafBox.top - rootBox.top}px`;
  cursor.style.height = `${Math.max(leafBox.height, 12)}px`;
}

function relativeLeaf(root: HTMLElement, current: HTMLElement, direction: 1 | -1): HTMLElement | undefined {
  const leaves = editableLeaves(root);
  const index = leaves.indexOf(current);
  return index >= 0 ? leaves[index + direction] : undefined;
}

function verticalLeaf(current: HTMLElement, direction: "up" | "down"): HTMLElement | undefined {
  const fraction = current.closest<HTMLElement>(".math-frac");
  if (fraction) {
    const inNumerator = current.closest(".math-frac-numerator");
    const inDenominator = current.closest(".math-frac-denominator");

    if (direction === "up" && inDenominator) {
      return firstLeaf(fraction.querySelector<HTMLElement>(".math-frac-numerator"), "end");
    }

    if (direction === "down" && inNumerator) {
      return firstLeaf(fraction.querySelector<HTMLElement>(".math-frac-denominator"), "start");
    }
  }

  const script = current.closest<HTMLElement>(".math-script");
  if (script) {
    if (direction === "up") {
      return (
        firstLeaf(script.querySelector<HTMLElement>(".math-script-sup"), "end") ??
        firstLeaf(script.querySelector<HTMLElement>(".math-script-base"), "end")
      );
    }

    return (
      firstLeaf(script.querySelector<HTMLElement>(".math-script-sub"), "start") ??
      firstLeaf(script.querySelector<HTMLElement>(".math-script-base"), "start")
    );
  }

  const sqrt = current.closest<HTMLElement>(".math-sqrt");
  if (sqrt) {
    if (direction === "up" && current.closest(".math-sqrt-body")) {
      return firstLeaf(sqrt.querySelector<HTMLElement>(".math-sqrt-index"), "end");
    }

    if (direction === "down" && current.closest(".math-sqrt-index")) {
      return firstLeaf(sqrt.querySelector<HTMLElement>(".math-sqrt-body"), "start");
    }
  }

  const root = current.closest<HTMLElement>(".structured-math");
  if (!root) return undefined;
  return closestLeafByGeometry(editableLeaves(root), current, direction);
}

function closestLeafFromPoint(root: HTMLElement, x: number, y: number): HTMLElement | undefined {
  return editableLeaves(root)
    .map((leaf) => ({ leaf, score: pointDistance(leaf.getBoundingClientRect(), x, y) }))
    .sort((a, b) => a.score - b.score)[0]?.leaf;
}

function closestLeafByGeometry(leaves: readonly HTMLElement[], current: HTMLElement, direction: "up" | "down"): HTMLElement | undefined {
  const currentBox = current.getBoundingClientRect();
  const currentX = currentBox.left + currentBox.width / 2;
  const candidates = leaves.filter((leaf) => {
    if (leaf === current) return false;
    const box = leaf.getBoundingClientRect();
    return direction === "up" ? box.bottom <= currentBox.top : box.top >= currentBox.bottom;
  });

  return candidates
    .map((leaf) => {
      const box = leaf.getBoundingClientRect();
      const leafX = box.left + box.width / 2;
      const leafY = direction === "up" ? box.bottom : box.top;
      const currentY = direction === "up" ? currentBox.top : currentBox.bottom;
      return {
        leaf,
        score: Math.abs(leafX - currentX) + Math.abs(leafY - currentY) * 1.6,
      };
    })
    .sort((a, b) => a.score - b.score)[0]?.leaf;
}

function editableLeaves(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".math-leaf"));
}

function firstLeaf(root: HTMLElement | null, edge: CursorEdge): HTMLElement | undefined {
  if (!root) return undefined;
  const leaves = editableLeaves(root);
  return edge === "start" ? leaves[0] : leaves.at(-1);
}

function edgeFromPoint(leaf: HTMLElement, x: number): CursorEdge {
  const box = leaf.getBoundingClientRect();
  return x < box.left + box.width / 2 ? "start" : "end";
}

function pointDistance(box: DOMRect, x: number, y: number): number {
  const dx = x < box.left ? box.left - x : x > box.right ? x - box.right : 0;
  const dy = y < box.top ? box.top - y : y > box.bottom ? y - box.bottom : 0;
  return dx + dy;
}

function layoutStructuredMath(root: HTMLElement | null): void {
  if (!root) return;

  root.querySelectorAll<HTMLElement>(".math-frac").forEach((fraction) => {
    const numerator = fraction.querySelector<HTMLElement>(".math-frac-numerator");
    const denominator = fraction.querySelector<HTMLElement>(".math-frac-denominator");
    const rule = fraction.querySelector<HTMLElement>(".math-frac-rule");
    if (!numerator || !denominator || !rule) return;

    const fontSize = Number.parseFloat(getComputedStyle(fraction).fontSize);
    const sep = Math.max(1.5, fontSize * 0.075);
    const ruleWidth = Math.max(1, fontSize * 0.045);
    const width = Math.max(numerator.scrollWidth, denominator.scrollWidth) + sep * 2;
    const numeratorHeight = numerator.getBoundingClientRect().height;
    const denominatorHeight = denominator.getBoundingClientRect().height;
    const axisShift = denominatorHeight * 0.42 - numeratorHeight * 0.18;
    fraction.style.setProperty("--frac-width", `${width}px`);
    fraction.style.setProperty("--frac-sep", `${sep}px`);
    fraction.style.setProperty("--frac-rule-width", `${ruleWidth}px`);
    fraction.style.setProperty("--frac-axis-shift", `${axisShift}px`);
  });

  root.querySelectorAll<HTMLElement>(".math-script").forEach((script) => {
    const base = script.querySelector<HTMLElement>(".math-script-base");
    const slots = script.querySelector<HTMLElement>(".math-script-slots");
    if (!base || !slots) return;

    const baseBox = base.getBoundingClientRect();
    const baseHeight = baseBox.height || Number.parseFloat(getComputedStyle(script).fontSize);
    const baseWidth = baseBox.width;
    const fontSize = Number.parseFloat(getComputedStyle(script).fontSize);
    const supOnly = script.classList.contains("math-script--sup-only");
    const subOnly = script.classList.contains("math-script--sub-only");
    const italicCorrection = estimateRightCorrection(base.dataset.mathText ?? base.textContent ?? "", baseWidth, fontSize);
    const offset = supOnly ? -baseHeight * 0.54 : subOnly ? baseHeight * 0.28 : -baseHeight * 0.1;
    slots.style.setProperty("--script-y", `${offset}px`);
    slots.style.setProperty("--script-x", `${italicCorrection}px`);
  });

  root.querySelectorAll<HTMLElement>(".math-sqrt").forEach((sqrt) => {
    const radical = sqrt.querySelector<HTMLElement>(".math-sqrt-radical");
    const body = sqrt.querySelector<HTMLElement>(".math-sqrt-body");
    if (!radical || !body) return;

    const bodyHeight = body.getBoundingClientRect().height;
    const fontSize = Number.parseFloat(getComputedStyle(sqrt).fontSize);
    const radicalScale = Math.max(1.08, bodyHeight / fontSize + 0.25);
    const overbarGap = Math.max(1, fontSize * 0.055);
    sqrt.style.setProperty("--sqrt-scale", String(radicalScale));
    sqrt.style.setProperty("--sqrt-gap", `${overbarGap}px`);
  });
}

function estimateRightCorrection(text: string, baseWidth: number, fontSize: number): number {
  if (!text) return 0;

  const last = text.trim().at(-1) ?? "";
  const slanted = /[fijltxyzαβγδπ∂]/i.test(last);
  if (!slanted) return 0;

  return -Math.min(fontSize * 0.08, baseWidth * 0.16);
}

function renderKatexFragment(node: MathNode, options: StructuredMathViewOptions, className = "math-katex-fragment"): HTMLElement {
  const element = span(className);
  try {
    katex.render(mathToLatex(node), element, {
      ...options.katexOptions,
      displayMode: false,
    });
  } catch {
    element.textContent = mathToLatex(node);
    element.classList.add("math-katex-error");
  }
  return element;
}

function createKatexFallback(options: StructuredMathViewOptions): HTMLElement {
  const wrapper = document.createElement(options.displayMode ? "div" : "span");
  wrapper.className = options.displayMode ? "tiptap-mathematics-render block-math-inner" : "tiptap-mathematics-render";
  wrapper.dataset.type = options.displayMode ? "block-math" : "inline-math";
  wrapper.setAttribute("data-latex", options.node.attrs.latex);

  try {
    katex.render(options.node.attrs.latex, wrapper, {
      ...options.katexOptions,
      displayMode: options.displayMode,
    });
  } catch {
    wrapper.textContent = options.node.attrs.latex;
    wrapper.classList.add("math-katex-error");
  }

  return wrapper;
}

function span(className: string): HTMLSpanElement {
  const element = document.createElement("span");
  element.className = className;
  return element;
}
