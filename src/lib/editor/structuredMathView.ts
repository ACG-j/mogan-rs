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
  wrapper.dataset.type = options.displayMode ? "block-math" : "inline-math";
  wrapper.setAttribute("data-latex", mathToLatex(mathAst));
  wrapper.appendChild(renderNode(mathAst, [], options));
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

  element.addEventListener("keydown", (event) => {
    event.stopPropagation();

    if (event.key === "Enter") {
      event.preventDefault();
      element.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      options.editor.view.focus();
      return;
    }
  });

  element.addEventListener("input", () => {
    layoutStructuredMath(element.closest<HTMLElement>(".structured-math"));
  });
  element.addEventListener("blur", () => updateSlot(path, element.textContent ?? "", options));
  element.addEventListener("mousedown", (event) => event.stopPropagation());
  element.addEventListener("click", (event) => event.stopPropagation());

  return element;
}

function updateSlot(path: MathPath, text: string, options: StructuredMathViewOptions): void {
  const current = normalizeMathNode(options.node.attrs.mathAst) ?? emptyMath;
  const next = replaceAtPath(current, path, textToEditableMath(text));
  const pos = options.getPos();

  if (pos === undefined) return;

  const attrs = mathAttrsFromAst(next);
  const tr = options.editor.state.tr.setNodeMarkup(pos, undefined, attrs);
  options.editor.view.dispatch(tr);
}

function layoutStructuredMath(root: HTMLElement | null): void {
  if (!root) return;

  root.querySelectorAll<HTMLElement>(".math-frac").forEach((fraction) => {
    const numerator = fraction.querySelector<HTMLElement>(".math-frac-numerator");
    const denominator = fraction.querySelector<HTMLElement>(".math-frac-denominator");
    if (!numerator || !denominator) return;

    const fontSize = Number.parseFloat(getComputedStyle(fraction).fontSize);
    const sep = Math.max(2, fontSize * 0.1);
    const width = Math.max(numerator.scrollWidth, denominator.scrollWidth) + sep * 2;
    fraction.style.setProperty("--frac-width", `${width}px`);
  });

  root.querySelectorAll<HTMLElement>(".math-script").forEach((script) => {
    const base = script.querySelector<HTMLElement>(".math-script-base");
    const slots = script.querySelector<HTMLElement>(".math-script-slots");
    if (!base || !slots) return;

    const baseHeight = base.getBoundingClientRect().height || Number.parseFloat(getComputedStyle(script).fontSize);
    const supOnly = script.classList.contains("math-script--sup-only");
    const subOnly = script.classList.contains("math-script--sub-only");
    const offset = supOnly ? -baseHeight * 0.42 : subOnly ? baseHeight * 0.22 : -baseHeight * 0.08;
    slots.style.setProperty("--script-y", `${offset}px`);
  });
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
