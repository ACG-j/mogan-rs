import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { KatexOptions } from "katex";

export type StructuredMathViewOptions = {
  readonly editor: Editor;
  readonly node: ProseMirrorNode;
  readonly getPos: () => number | undefined;
  readonly displayMode: boolean;
  readonly katexOptions?: KatexOptions;
};
