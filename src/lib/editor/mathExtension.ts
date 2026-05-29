import { Mathematics } from "@tiptap/extension-mathematics";

function parseMathAstAttribute(value: string | null): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const StructuredMathematics = Mathematics.extend({
  addGlobalAttributes() {
    return [
      {
        types: ["inlineMath", "blockMath"],
        attributes: {
          mathAst: {
            default: null,
            parseHTML: (element) => parseMathAstAttribute(element.getAttribute("data-math-ast")),
            renderHTML: (attributes) => {
              if (!attributes.mathAst) return {};
              return {
                "data-math-ast": JSON.stringify(attributes.mathAst),
              };
            },
          },
        },
      },
    ];
  },
});
