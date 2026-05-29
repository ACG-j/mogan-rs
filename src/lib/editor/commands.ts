import type { Editor, JSONContent } from "@tiptap/core";
import { cycleLatexSymbol } from "../math/cycleRules";
import { applyLegoRules } from "../math/legoRules";
import { templateLatex, type MathTemplate } from "../math/latex";

function selectedText(editor: Editor): string {
  const { state } = editor;
  const { from, to } = state.selection;
  return from === to ? "" : state.doc.textBetween(from, to, " ");
}

export function insertInlineMath(editor: Editor, latex = "x"): void {
  editor.chain().focus().insertInlineMath({ latex }).run();
}

export function insertBlockMath(editor: Editor, latex = "x^2 + y^2 = z^2"): void {
  editor.chain().focus().insertBlockMath({ latex }).run();
}

export function insertMathTemplate(editor: Editor, template: MathTemplate): void {
  const selected = selectedText(editor).trim();
  let latex = templateLatex(template);

  if (selected) {
    switch (template) {
      case "fraction":
        latex = `\\frac{${selected}}{}`;
        break;
      case "sqrt":
        latex = `\\sqrt{${selected}}`;
        break;
      case "varSqrt":
        latex = `\\sqrt[n]{${selected}}`;
        break;
      case "subscript":
        latex = `${selected}_i`;
        break;
      case "superscript":
        latex = `${selected}^2`;
        break;
      case "script":
        latex = `${selected}_i^2`;
        break;
      case "neg":
        latex = `\\neg ${selected}`;
        break;
      case "matrix":
      case "cases":
        break;
    }
  }

  insertInlineMath(editor, latex);
}

export function insertLegoSymbol(editor: Editor, trigger: string): void {
  insertInlineMath(editor, applyLegoRules(trigger));
}

export function cycleSelectedMath(editor: Editor): boolean {
  const { state } = editor;
  const selectedNode = state.selection.$from.nodeAfter;

  if (!selectedNode || !["inlineMath", "blockMath"].includes(selectedNode.type.name)) {
    return false;
  }

  const pos = state.selection.$from.pos;
  const latex = cycleLatexSymbol(String(selectedNode.attrs.latex ?? ""));
  const attrs = { ...selectedNode.attrs, latex };

  editor.view.dispatch(state.tr.setNodeMarkup(pos, undefined, attrs));
  return true;
}

export function cycleTextBeforeCursor(editor: Editor): boolean {
  const { state } = editor;
  const { from, to } = state.selection;
  if (from !== to || from <= 1) return false;

  const input = state.doc.textBetween(from - 1, from, "");
  const latex = cycleLatexSymbol(input);
  if (!input || latex === input) return false;

  editor
    .chain()
    .focus()
    .deleteRange({ from: from - 1, to: from })
    .insertInlineMath({ latex })
    .run();
  return true;
}

export function makeInitialContent(): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "全微分" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "设 " },
          { type: "inlineMath", attrs: { latex: "z=f(x,y)=x^y" } },
          { type: "text", text: "，则" },
        ],
      },
      {
        type: "blockMath",
        attrs: {
          latex:
            "dz=\\frac{\\partial z}{\\partial x}\\cdot dx+\\frac{\\partial z}{\\partial y}\\cdot dy=yx^{y-1}dx+x^y\\ln xdy",
        },
      },
      {
        type: "blockMath",
        attrs: { latex: "dz\\vert_{(e,2)}=2e dx+e^2dy" },
      },
    ],
  };
}
