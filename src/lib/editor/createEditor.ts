import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { makeInitialContent } from "./initialContent";
import { handleEditorKeyDown } from "./keymap";
import { StructuredMathematics } from "./mathExtension";

type CreateMoganEditorOptions = {
  readonly element: HTMLElement;
  readonly emitDocumentChange: () => void;
};

export function createMoganEditor({
  element,
  emitDocumentChange,
}: CreateMoganEditorOptions): Editor {
  let editor: Editor;

  editor = new Editor({
    element,
    extensions: [
      StarterKit,
      StructuredMathematics.configure({
        katexOptions: {
          throwOnError: false,
          strict: false,
        },
      }),
    ],
    content: makeInitialContent(),
    editorProps: {
      attributes: {
        class: "mogan-editor-surface",
        spellcheck: "false",
      },
      handleKeyDown: (_view, event) => {
        handleEditorKeyDown(editor, event, emitDocumentChange);
        return event.defaultPrevented;
      },
    },
    onCreate: emitDocumentChange,
    onUpdate: emitDocumentChange,
  });

  return editor;
}
