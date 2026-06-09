import type { Editor } from "@tiptap/core";
import {
  cycleSelectedMath,
  cycleTextBeforeCursor,
  insertBlockMath,
  insertInlineMath,
  insertMathTemplate,
} from "./commands";

export function handleEditorKeyDown(
  editor: Editor,
  event: KeyboardEvent,
  emitDocumentChange: () => void,
): void {
  if (event.key === "$" && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    insertInlineMath(editor, "x");
    emitDocumentChange();
    return;
  }

  if (event.key === "$" && event.altKey) {
    event.preventDefault();
    insertBlockMath(editor);
    emitDocumentChange();
    return;
  }

  if (event.altKey && !event.ctrlKey && !event.metaKey) {
    switch (event.key) {
      case "f":
        event.preventDefault();
        insertMathTemplate(editor, "fraction");
        emitDocumentChange();
        return;
      case "s":
        event.preventDefault();
        insertMathTemplate(editor, "sqrt");
        emitDocumentChange();
        return;
      case "r":
        event.preventDefault();
        insertMathTemplate(editor, "varSqrt");
        emitDocumentChange();
        return;
      case "n":
        event.preventDefault();
        insertMathTemplate(editor, "neg");
        emitDocumentChange();
        return;
    }
  }

  if (event.key === "_" && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    insertMathTemplate(editor, "subscript");
    emitDocumentChange();
    return;
  }

  if (event.key === "^" && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    insertMathTemplate(editor, "superscript");
    emitDocumentChange();
    return;
  }

  if (event.key === "Tab") {
    const handled = cycleSelectedMath(editor) || cycleTextBeforeCursor(editor);
    if (handled) {
      event.preventDefault();
      emitDocumentChange();
    }
  }
}
