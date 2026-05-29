import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import katex, { type KatexOptions } from "katex";
import { emptyMath, normalizeMathNode, type MathNode } from "../math/ast";
import { mathToLatex, mathAttrsFromAst } from "../math/serialize";
import { mathToEditableText, nodeAtPath, replaceAtPath, textToEditableMath, type MathPath } from "../math/editPath";

type StructuredMathViewOptions = {
  readonly editor: Editor;
  readonly node: ProseMirrorNode;
  readonly getPos: () => number | undefined;
  readonly displayMode: boolean;
  readonly katexOptions?: KatexOptions;
};

type SlotRenderOptions = {
  readonly className?: string;
  readonly placeholder?: string;
};

export function createStructuredMathView(options: StructuredMathViewOptions): HTMLElement {
  const mathAst = normalizeMathNode(options.node.attrs.mathAst);

  if (!mathAst) {
    return createKatexFallback(options);
  }

  const wrapper = document.createElement(options.displayMode ? "div" : "span");
  wrapper.className = options.displayMode ? "structured-math structured-math--block" : "structured-math structured-math--inline";
  wrapper.tabIndex = -1;
  wrapper.dataset.type = options.displayMode ? "block-math" : "inline-math";
  wrapper.setAttribute("data-latex", mathToLatex(mathAst));
  setRootAst(wrapper, mathAst);
  wrapper.appendChild(renderNode(mathAst, [], options));
  wrapper.addEventListener("keydown", ((event: KeyboardEvent) => handleRootNavigation(event, wrapper)) as EventListener);
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
    case "symbol": {
      return renderKatexFragment(node, options, "math-symbol");
    }
    case "placeholder":
      return renderSlot(path, options, { className: "math-placeholder", placeholder: node.label ?? "" });
    case "frac": {
      const element = span("math-frac");
      element.appendChild(renderSlot([...path, "numerator"], options, { className: "math-frac-slot math-frac-numerator" }, node.numerator));
      element.appendChild(span("math-frac-rule"));
      element.appendChild(
        renderSlot([...path, "denominator"], options, { className: "math-frac-slot math-frac-denominator" }, node.denominator),
      );
      return element;
    }
    case "sqrt": {
      const element = span("math-sqrt");
      if (node.index) {
        element.appendChild(renderSlot([...path, "index"], options, { className: "math-sqrt-index" }, node.index));
      }
      const radical = span("math-sqrt-radical");
      radical.textContent = "√";
      element.appendChild(radical);
      element.appendChild(renderSlot([...path, "body"], options, { className: "math-sqrt-body" }, node.body));
      return element;
    }
    case "script": {
      const mode = node.sup && node.sub ? "both" : node.sup ? "sup-only" : "sub-only";
      const element = span(`math-script math-script--${mode}`);
      element.appendChild(renderSlot([...path, "base"], options, { className: "math-script-base" }, node.base));

      const scripts = span("math-script-slots");
      if (node.sup) scripts.appendChild(renderSlot([...path, "sup"], options, { className: "math-script-sup" }, node.sup));
      if (node.sub) scripts.appendChild(renderSlot([...path, "sub"], options, { className: "math-script-sub" }, node.sub));
      element.appendChild(scripts);
      return element;
    }
    case "neg": {
      const element = span("math-neg");
      const sign = span("math-neg-sign");
      sign.textContent = "¬";
      element.appendChild(sign);
      element.appendChild(renderSlot([...path, "body"], options, { className: "math-neg-body" }, node.body));
      return element;
    }
    case "matrix":
    case "cases":
      return renderKatexFragment(node, options);
  }
}

function renderSlot(
  path: MathPath,
  options: StructuredMathViewOptions,
  slotOptions: SlotRenderOptions = {},
  node = nodeAtPath(normalizeMathNode(options.node.attrs.mathAst) ?? emptyMath, path),
): HTMLElement {
  const element = span(`math-edit-slot ${slotOptions.className ?? ""}`.trim());
  element.contentEditable = "true";
  element.spellcheck = false;
  element.dataset.path = path.join(".");
  element.dataset.placeholder = slotOptions.placeholder ?? "";
  element.textContent = mathToEditableText(node);
  element.dataset.mathText = element.textContent;

  element.addEventListener("keydown", (event) => {
    event.stopPropagation();

    if (event.key === "Enter") {
      event.preventDefault();
      commitRoot(element, options);
      return;
    }

    if (handleSlotNavigation(event, element, path, options)) return;

    if (event.key === "Escape") {
      event.preventDefault();
      options.editor.view.focus();
      return;
    }
  });

  element.addEventListener("input", () => {
    element.dataset.mathText = element.textContent ?? "";
    layoutStructuredMath(element.closest<HTMLElement>(".structured-math"));
  });
  element.addEventListener("blur", () => {
    const root = element.closest<HTMLElement>(".structured-math");
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (root && active instanceof HTMLElement && root.contains(active)) return;
      commitRoot(element, options);
    });
  });
  element.addEventListener("mousedown", (event) => event.stopPropagation());
  element.addEventListener("click", (event) => event.stopPropagation());

  return element;
}

function handleRootNavigation(event: KeyboardEvent, root: HTMLElement): void {
  if (event.target instanceof HTMLElement && event.target.closest(".math-edit-slot")) return;
  if (!["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;

  event.preventDefault();
  event.stopPropagation();

  const backward = event.shiftKey || event.key === "ArrowLeft" || event.key === "ArrowUp";
  focusEdgeSlot(root, backward ? "end" : "start");
}

function handleSlotNavigation(event: KeyboardEvent, element: HTMLElement, path: MathPath, options: StructuredMathViewOptions): boolean {
  const root = element.closest<HTMLElement>(".structured-math");
  if (!root) return false;

  if (event.key === "Tab") {
    event.preventDefault();
    event.stopPropagation();
    syncSlotToRoot(root, path, element.textContent ?? "", options);
    focusRelativeSlot(root, element, event.shiftKey ? -1 : 1);
    return true;
  }

  if (event.key === "ArrowUp") {
    const target = verticalTarget(element, "up");
    event.preventDefault();
    event.stopPropagation();
    if (!target) return true;
    syncSlotToRoot(root, path, element.textContent ?? "", options);
    focusSlot(target);
    return true;
  }

  if (event.key === "ArrowDown") {
    const target = verticalTarget(element, "down");
    event.preventDefault();
    event.stopPropagation();
    if (!target) return true;
    syncSlotToRoot(root, path, element.textContent ?? "", options);
    focusSlot(target);
    return true;
  }

  if (event.key === "ArrowLeft" && caretAtBoundary(element, "start")) {
    const previous = relativeSlot(root, element, -1);
    event.preventDefault();
    event.stopPropagation();
    if (!previous) return true;
    syncSlotToRoot(root, path, element.textContent ?? "", options);
    focusSlot(previous, "end");
    return true;
  }

  if (event.key === "ArrowRight" && caretAtBoundary(element, "end")) {
    const next = relativeSlot(root, element, 1);
    event.preventDefault();
    event.stopPropagation();
    if (!next) return true;
    syncSlotToRoot(root, path, element.textContent ?? "", options);
    focusSlot(next, "start");
    return true;
  }

  return false;
}

function focusRelativeSlot(root: HTMLElement, current: HTMLElement, direction: 1 | -1): void {
  const target = relativeSlot(root, current, direction);
  if (target) focusSlot(target, direction === 1 ? "start" : "end");
}

function focusEdgeSlot(root: HTMLElement, edge: "start" | "end"): void {
  const slots = editableSlots(root);
  const target = edge === "start" ? slots[0] : slots.at(-1);
  if (target) focusSlot(target, edge);
}

function relativeSlot(root: HTMLElement, current: HTMLElement, direction: 1 | -1): HTMLElement | undefined {
  const slots = editableSlots(root);
  const index = slots.indexOf(current);
  return index >= 0 ? slots[index + direction] : undefined;
}

function verticalTarget(current: HTMLElement, direction: "up" | "down"): HTMLElement | undefined {
  const fraction = current.closest<HTMLElement>(".math-frac");
  if (fraction) {
    if (direction === "up" && current.classList.contains("math-frac-denominator")) {
      return fraction.querySelector<HTMLElement>(".math-frac-numerator") ?? undefined;
    }

    if (direction === "down" && current.classList.contains("math-frac-numerator")) {
      return fraction.querySelector<HTMLElement>(".math-frac-denominator") ?? undefined;
    }
  }

  const script = current.closest<HTMLElement>(".math-script");
  if (script) {
    if (direction === "up") {
      return (
        script.querySelector<HTMLElement>(".math-script-sup") ??
        script.querySelector<HTMLElement>(".math-script-base") ??
        undefined
      );
    }

    return (
      script.querySelector<HTMLElement>(".math-script-sub") ??
      script.querySelector<HTMLElement>(".math-script-base") ??
      undefined
    );
  }

  const sqrt = current.closest<HTMLElement>(".math-sqrt");
  if (sqrt) {
    if (direction === "up" && current.classList.contains("math-sqrt-body")) {
      return sqrt.querySelector<HTMLElement>(".math-sqrt-index") ?? undefined;
    }

    if (direction === "down" && current.classList.contains("math-sqrt-index")) {
      return sqrt.querySelector<HTMLElement>(".math-sqrt-body") ?? undefined;
    }
  }

  const root = current.closest<HTMLElement>(".structured-math");
  if (!root) return undefined;

  return closestSlotByGeometry(editableSlots(root), current, direction);
}

function closestSlotByGeometry(slots: readonly HTMLElement[], current: HTMLElement, direction: "up" | "down"): HTMLElement | undefined {
  const currentBox = current.getBoundingClientRect();
  const currentX = currentBox.left + currentBox.width / 2;
  const candidates = slots.filter((slot) => {
    if (slot === current) return false;
    const box = slot.getBoundingClientRect();
    return direction === "up" ? box.bottom <= currentBox.top : box.top >= currentBox.bottom;
  });

  return candidates
    .map((slot) => {
      const box = slot.getBoundingClientRect();
      const slotX = box.left + box.width / 2;
      const slotY = direction === "up" ? box.bottom : box.top;
      const currentY = direction === "up" ? currentBox.top : currentBox.bottom;
      return {
        slot,
        score: Math.abs(slotX - currentX) + Math.abs(slotY - currentY) * 1.6,
      };
    })
    .sort((a, b) => a.score - b.score)[0]?.slot;
}

function editableSlots(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".math-edit-slot"));
}

function focusSlot(slot: HTMLElement, edge: "start" | "end" = "end"): void {
  slot.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  const textNode = slot.firstChild;
  const offset = edge === "start" ? 0 : (textNode?.textContent?.length ?? 0);

  range.setStart(textNode ?? slot, textNode ? offset : 0);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function caretAtBoundary(element: HTMLElement, boundary: "start" | "end"): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return true;

  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer) || !range.collapsed) return false;

  const offset = range.startOffset;
  const textLength = element.textContent?.length ?? 0;
  return boundary === "start" ? offset === 0 : offset >= textLength;
}

function syncSlotToRoot(root: HTMLElement, path: MathPath, text: string, options: StructuredMathViewOptions): void {
  const current = getRootAst(root) ?? normalizeMathNode(options.node.attrs.mathAst) ?? emptyMath;
  setRootAst(root, replaceAtPath(current, path, textToEditableMath(text)));
}

function commitRoot(element: HTMLElement, options: StructuredMathViewOptions): void {
  const root = element.closest<HTMLElement>(".structured-math");
  if (!root) return;

  const elementPath = pathFromSlot(element);
  if (elementPath) syncSlotToRoot(root, elementPath, element.textContent ?? "", options);

  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== element && active.classList.contains("math-edit-slot")) {
    const path = pathFromSlot(active);
    if (path) syncSlotToRoot(root, path, active.textContent ?? "", options);
  }

  updateMathAst(getRootAst(root) ?? normalizeMathNode(options.node.attrs.mathAst) ?? emptyMath, options);
}

function updateMathAst(next: MathNode, options: StructuredMathViewOptions): void {
  const pos = options.getPos();

  if (pos === undefined) return;

  const attrs = mathAttrsFromAst(next);
  const tr = options.editor.state.tr.setNodeMarkup(pos, undefined, attrs);
  options.editor.view.dispatch(tr);
}

function setRootAst(root: HTMLElement, ast: MathNode): void {
  root.dataset.mathAst = JSON.stringify(ast);
}

function getRootAst(root: HTMLElement): MathNode | undefined {
  try {
    return normalizeMathNode(JSON.parse(root.dataset.mathAst ?? "null"));
  } catch {
    return undefined;
  }
}

function pathFromSlot(slot: HTMLElement): MathPath | undefined {
  if (!slot.classList.contains("math-edit-slot")) return undefined;
  const path = slot.dataset.path ?? "";
  return path ? path.split(".") : [];
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
