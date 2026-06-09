import { Extension } from "@tiptap/core";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";
import type { KatexOptions } from "katex";
import { createStructuredMathView } from "./structuredMathView";

type StructuredMathematicsOptions = {
  readonly inlineOptions?: Record<string, unknown>;
  readonly blockOptions?: Record<string, unknown>;
  readonly katexOptions?: KatexOptions;
};

function parseMathAstAttribute(value: string | null): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const mathAstAttribute = {
  default: null,
  parseHTML: (element: HTMLElement) => parseMathAstAttribute(element.getAttribute("data-math-ast")),
  renderHTML: (attributes: Record<string, unknown>) => {
    if (!attributes.mathAst) return {};
    return {
      "data-math-ast": JSON.stringify(attributes.mathAst),
    };
  },
};

const StructuredInlineMath = InlineMath.extend({
  addAttributes(this: any) {
    return {
      ...(this.parent?.() ?? {}),
      mathAst: mathAstAttribute,
    };
  },

  addNodeView(this: any) {
    const { katexOptions } = this.options;

    return ({ editor, node, getPos }: any) => ({
      dom: createStructuredMathView({
        editor,
        node,
        getPos,
        displayMode: false,
        katexOptions,
      }),
      ignoreMutation: () => true,
      stopEvent: (event: Event) => {
        if (!(event.target instanceof HTMLElement)) return false;
        if (!event.target.closest(".structured-math")) return false;
        return event.type === "mousedown" || event.type === "keydown";
      },
    });
  },
});

const StructuredBlockMath = BlockMath.extend({
  addAttributes(this: any) {
    return {
      ...(this.parent?.() ?? {}),
      mathAst: mathAstAttribute,
    };
  },

  addNodeView(this: any) {
    const { katexOptions } = this.options;

    return ({ editor, node, getPos }: any) => ({
      dom: createStructuredMathView({
        editor,
        node,
        getPos,
        displayMode: true,
        katexOptions,
      }),
      ignoreMutation: () => true,
      stopEvent: (event: Event) => {
        if (!(event.target instanceof HTMLElement)) return false;
        if (!event.target.closest(".structured-math")) return false;
        return event.type === "mousedown" || event.type === "keydown";
      },
    });
  },
});

export const StructuredMathematics = Extension.create<StructuredMathematicsOptions>({
  name: "structuredMathematics",

  addOptions() {
    return {
      inlineOptions: undefined,
      blockOptions: undefined,
      katexOptions: undefined,
    };
  },

  addExtensions() {
    return [
      StructuredBlockMath.configure({ ...this.options.blockOptions, katexOptions: this.options.katexOptions }),
      StructuredInlineMath.configure({ ...this.options.inlineOptions, katexOptions: this.options.katexOptions }),
    ];
  },
});
