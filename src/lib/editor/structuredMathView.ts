import katex from "katex";
import { normalizeMathNode } from "../math/ast";
import { mathToLatex } from "../math/serialize";
import { mathClass } from "./structuredMath/dom";
import { layoutStructuredMath } from "./structuredMath/layout";
import {
  clearCursor,
  handleRootKeyDown,
  handleRootPointer,
} from "./structuredMath/navigation";
import { renderNode } from "./structuredMath/render";
import type { StructuredMathViewOptions } from "./structuredMath/types";

export function createStructuredMathView(
  options: StructuredMathViewOptions,
): HTMLElement {
  const mathAst = normalizeMathNode(options.node.attrs.mathAst);

  if (!mathAst) {
    return createKatexFallback(options);
  }

  const wrapper = document.createElement(options.displayMode ? "div" : "span");
  wrapper.className = options.displayMode
    ? `${mathClass.root} ${mathClass.blockRoot}`
    : `${mathClass.root} ${mathClass.inlineRoot}`;
  wrapper.tabIndex = 0;
  wrapper.dataset.type = options.displayMode ? "block-math" : "inline-math";
  wrapper.dataset.nodePos = String(options.getPos() ?? "");
  wrapper.setAttribute("data-latex", mathToLatex(mathAst));
  wrapper.appendChild(renderNode(mathAst, [], options));
  wrapper.addEventListener("mousedown", ((event: MouseEvent) =>
    handleRootPointer(event, wrapper)) as EventListener);
  wrapper.addEventListener("keydown", ((event: KeyboardEvent) =>
    handleRootKeyDown(event, wrapper, options)) as EventListener);
  wrapper.addEventListener("blur", () => clearCursor(wrapper));
  requestAnimationFrame(() => layoutStructuredMath(wrapper));

  return wrapper;
}

function createKatexFallback(options: StructuredMathViewOptions): HTMLElement {
  const wrapper = document.createElement(options.displayMode ? "div" : "span");
  wrapper.className = options.displayMode
    ? "tiptap-mathematics-render block-math-inner"
    : "tiptap-mathematics-render";
  wrapper.dataset.type = options.displayMode ? "block-math" : "inline-math";
  wrapper.setAttribute("data-latex", options.node.attrs.latex);

  try {
    katex.render(options.node.attrs.latex, wrapper, {
      ...options.katexOptions,
      displayMode: options.displayMode,
    });
  } catch {
    wrapper.textContent = options.node.attrs.latex;
    wrapper.classList.add(mathClass.katexError);
  }

  return wrapper;
}
