import type { Editor, JSONContent } from "@tiptap/core";
import { cycleLatexSymbol } from "../math/cycleRules";
import { applyLegoRules } from "../math/legoRules";
import { templateLatex, type MathTemplate } from "../math/latex";
import { emptyMath, row, symbol, textMath, type MathNode } from "../math/ast";
import { fallbackMathFromLatex, mathAttrsFromAst, mathNodeFromAttrs, type MathAttrs } from "../math/serialize";

function selectedText(editor: Editor): string {
  const { state } = editor;
  const { from, to } = state.selection;
  return from === to ? "" : state.doc.textBetween(from, to, " ");
}

function selectedMath(editor: Editor): MathNode {
  return textMath(selectedText(editor));
}

function insertInlineMathAst(editor: Editor, mathAst: MathNode): void {
  insertMathNode(editor, "inlineMath", mathAttrsFromAst(mathAst));
}

function insertBlockMathAst(editor: Editor, mathAst: MathNode): void {
  insertMathNode(editor, "blockMath", mathAttrsFromAst(mathAst));
}

function insertMathNode(editor: Editor, type: "inlineMath" | "blockMath", attrs: MathAttrs): void {
  const nodeType = editor.schema.nodes[type];
  if (!nodeType) return;

  const { state } = editor;
  const tr = state.tr.replaceSelectionWith(nodeType.create(attrs));
  editor.view.dispatch(tr.scrollIntoView());
  editor.view.focus();
}

export function insertInlineMath(editor: Editor, latex = "x"): void {
  insertInlineMathAst(editor, fallbackMathFromLatex(latex));
}

export function insertBlockMath(editor: Editor, latex = "x^2 + y^2 = z^2"): void {
  insertBlockMathAst(editor, fallbackMathFromLatex(latex));
}

export function insertMathTemplate(editor: Editor, template: MathTemplate): void {
  const selected = selectedText(editor).trim();
  const base = selected ? selectedMath(editor) : symbol("x");
  let mathAst: MathNode = fallbackMathFromLatex(templateLatex(template));

  switch (template) {
    case "fraction":
      mathAst = { type: "frac", numerator: selected ? base : symbol("1"), denominator: selected ? emptyMath : symbol("2") };
      break;
    case "sqrt":
      mathAst = { type: "sqrt", body: base };
      break;
    case "varSqrt":
      mathAst = { type: "sqrt", index: symbol("n"), body: base };
      break;
    case "subscript":
      mathAst = { type: "script", base, sub: symbol("i") };
      break;
    case "superscript":
      mathAst = { type: "script", base, sup: symbol("2") };
      break;
    case "script":
      mathAst = { type: "script", base, sub: symbol("i"), sup: symbol("2") };
      break;
    case "neg":
      mathAst = { type: "neg", body: base };
      break;
    case "matrix":
      mathAst = {
        type: "matrix",
        rows: [
          [symbol("a"), symbol("b")],
          [symbol("c"), symbol("d")],
        ],
      };
      break;
    case "cases":
      mathAst = {
        type: "cases",
        rows: [
          { body: symbol("x"), condition: row([symbol("x"), symbol(">"), symbol("0")]) },
          { body: symbol("0"), condition: row([symbol("x"), symbol("\\le"), symbol("0")]) },
        ],
      };
      break;
  }

  insertInlineMathAst(editor, mathAst);
}

export function insertLegoSymbol(editor: Editor, trigger: string): void {
  insertInlineMathAst(editor, symbol(applyLegoRules(trigger)));
}

export function cycleSelectedMath(editor: Editor): boolean {
  const { state } = editor;
  const selectedNode = state.selection.$from.nodeAfter;

  if (!selectedNode || !["inlineMath", "blockMath"].includes(selectedNode.type.name)) {
    return false;
  }

  const pos = state.selection.$from.pos;
  const mathAst = mathNodeFromAttrs(selectedNode.attrs);

  if (mathAst?.type === "symbol") {
    const cycled = symbol(cycleLatexSymbol(mathAst.value));
    editor.view.dispatch(state.tr.setNodeMarkup(pos, undefined, mathAttrsFromAst(cycled)));
    return true;
  }

  const latex = cycleLatexSymbol(String(selectedNode.attrs.latex ?? ""));
  const attrs = mathAttrsFromAst(symbol(latex));

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
    .run();
  insertInlineMathAst(editor, symbol(latex));
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
          {
            type: "inlineMath",
            attrs: mathAttrsFromAst(row([symbol("z=f(x,y)="), { type: "script", base: symbol("x"), sup: symbol("y") }])),
          },
          { type: "text", text: "，则" },
        ],
      },
      {
        type: "blockMath",
        attrs: mathAttrsFromAst(
          row([
            symbol("dz="),
            {
              type: "frac",
              numerator: row([symbol("\\partial"), symbol("z")]),
              denominator: row([symbol("\\partial"), symbol("x")]),
            },
            symbol("\\cdot"),
            symbol("dx+"),
            {
              type: "frac",
              numerator: row([symbol("\\partial"), symbol("z")]),
              denominator: row([symbol("\\partial"), symbol("y")]),
            },
            symbol("\\cdot"),
            symbol("dy=yx^{y-1}dx+x^y"),
            symbol("\\ln"),
            symbol("xdy"),
          ]),
        ),
      },
      {
        type: "blockMath",
        attrs: mathAttrsFromAst(row([symbol("dz\\vert_{(e,2)}=2e dx+e^2dy")])),
      },
    ],
  };
}
