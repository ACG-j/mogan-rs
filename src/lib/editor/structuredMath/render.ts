import katex from "katex";
import type { MathNode } from "../../math/ast";
import { mathToEditableText, type MathPath } from "../../math/editPath";
import { mathToLatex } from "../../math/serialize";
import { mathClass, span } from "./dom";
import type { StructuredMathViewOptions } from "./types";

type LeafRenderOptions = {
  readonly className?: string;
  readonly placeholder?: string;
};

export function renderNode(
  node: MathNode,
  path: MathPath,
  options: StructuredMathViewOptions,
): HTMLElement {
  switch (node.type) {
    case "row": {
      const element = span(mathClass.row);
      node.children.forEach((child, index) =>
        element.appendChild(
          renderNode(child, [...path, String(index)], options),
        ),
      );
      return element;
    }
    case "symbol":
      return renderLeaf(path, node, { className: mathClass.symbolLeaf });
    case "placeholder":
      return renderLeaf(path, node, {
        className: mathClass.placeholder,
        placeholder: node.label ?? "",
      });
    case "frac": {
      const element = span(mathClass.frac);
      element.appendChild(
        renderStructureSlot(
          [...path, "numerator"],
          options,
          `${mathClass.fracSlot} ${mathClass.fracNumerator}`,
          node.numerator,
        ),
      );
      element.appendChild(span(mathClass.fracRule));
      element.appendChild(
        renderStructureSlot(
          [...path, "denominator"],
          options,
          `${mathClass.fracSlot} ${mathClass.fracDenominator}`,
          node.denominator,
        ),
      );
      return element;
    }
    case "sqrt": {
      const element = span(mathClass.sqrt);
      if (node.index) {
        element.appendChild(
          renderStructureSlot(
            [...path, "index"],
            options,
            mathClass.sqrtIndex,
            node.index,
          ),
        );
      }
      const radical = span(mathClass.sqrtRadical);
      radical.textContent = "√";
      element.appendChild(radical);
      element.appendChild(
        renderStructureSlot(
          [...path, "body"],
          options,
          mathClass.sqrtBody,
          node.body,
        ),
      );
      return element;
    }
    case "script": {
      const mode =
        node.sup && node.sub ? "both" : node.sup ? "sup-only" : "sub-only";
      const element = span(`${mathClass.script} math-script--${mode}`);
      element.appendChild(
        renderStructureSlot(
          [...path, "base"],
          options,
          mathClass.scriptBase,
          node.base,
        ),
      );

      const scripts = span(mathClass.scriptSlots);
      if (node.sup)
        scripts.appendChild(
          renderStructureSlot(
            [...path, "sup"],
            options,
            mathClass.scriptSup,
            node.sup,
          ),
        );
      if (node.sub)
        scripts.appendChild(
          renderStructureSlot(
            [...path, "sub"],
            options,
            mathClass.scriptSub,
            node.sub,
          ),
        );
      element.appendChild(scripts);
      return element;
    }
    case "neg": {
      const element = span(mathClass.neg);
      const sign = span(mathClass.negSign);
      sign.textContent = "¬";
      element.appendChild(sign);
      element.appendChild(
        renderStructureSlot(
          [...path, "body"],
          options,
          mathClass.negBody,
          node.body,
        ),
      );
      return element;
    }
    case "matrix":
    case "cases":
      return renderKatexFragment(node, options);
  }
}

export function renderKatexFragment(
  node: MathNode,
  options: StructuredMathViewOptions,
  className = mathClass.katexFragment,
): HTMLElement {
  const element = span(className);
  try {
    katex.render(mathToLatex(node), element, {
      ...options.katexOptions,
      displayMode: false,
    });
  } catch {
    element.textContent = mathToLatex(node);
    element.classList.add(mathClass.katexError);
  }
  return element;
}

function renderStructureSlot(
  path: MathPath,
  options: StructuredMathViewOptions,
  className: string,
  node: MathNode,
): HTMLElement {
  const element = span(`${mathClass.structSlot} ${className}`.trim());
  element.dataset.path = path.join(".");
  element.appendChild(renderNode(node, path, options));
  return element;
}

function renderLeaf(
  path: MathPath,
  node: MathNode,
  options: LeafRenderOptions = {},
): HTMLElement {
  const element = span(`${mathClass.leaf} ${options.className ?? ""}`.trim());
  const text = mathToEditableText(node);
  element.dataset.path = path.join(".");
  element.dataset.mathText = text;
  element.dataset.placeholder = options.placeholder ?? "";
  element.textContent = text;
  return element;
}
