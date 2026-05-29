<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import "katex/dist/katex.min.css";
  import { StructuredMathematics } from "./mathExtension";
  import {
    cycleTextBeforeCursor,
    cycleSelectedMath,
    insertBlockMath,
    insertInlineMath,
    insertMathTemplate,
    makeInitialContent,
  } from "./commands";

  type Props = {
    onDocumentChange?: (payload: { json: unknown; typst: string }) => void;
  };

  let { onDocumentChange }: Props = $props();

  let editorContainer: HTMLDivElement;
  let editor: Editor | undefined;

  function emitDocumentChange(): void {
    if (!editor || !onDocumentChange) return;

    import("./serializeTypst").then(({ documentToTypst }) => {
      const json = editor?.getJSON();
      if (!json) return;
      onDocumentChange({ json, typst: documentToTypst(json) });
    });
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!editor) return;

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

  onMount(() => {
    editor = new Editor({
      element: editorContainer,
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
          handleKeyDown(event);
          return event.defaultPrevented;
        },
      },
      onCreate: emitDocumentChange,
      onUpdate: emitDocumentChange,
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });
</script>

<section class="editor-shell">
  <div class="page-shadow">
    <div class="editor-wrapper" bind:this={editorContainer}></div>
  </div>
</section>

<style>
  .editor-shell {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    height: 100%;
    min-width: 0;
    padding: 38px 24px 72px;
    overflow: auto;
  }

  .page-shadow {
    width: min(860px, calc(100vw - 64px));
    min-height: min(1080px, calc(100vh - 188px));
    border: 1px solid #151816;
    background: #222624;
    box-shadow:
      0 18px 40px rgb(0 0 0 / 24%),
      0 0 0 1px rgb(255 255 255 / 5%) inset;
  }

  .editor-wrapper {
    min-height: inherit;
  }

  .editor-wrapper :global(.mogan-editor-surface) {
    box-sizing: border-box;
    min-height: inherit;
    max-width: none;
    margin: 0 auto;
    padding: 92px 82px 112px;
    outline: none;
    color: #f6f6f4;
    caret-color: #ffffff;
    font: 22px/1.85 "Times New Roman", "Noto Serif CJK SC", serif;
    text-align: center;
  }

  .editor-wrapper :global(.mogan-editor-surface h1) {
    margin: 0 0 58px;
    text-align: center;
    color: #ffffff;
    font-size: 30px;
    line-height: 1.25;
    font-weight: 700;
  }

  .editor-wrapper :global(.mogan-editor-surface p) {
    margin: 24px 0;
  }

  .editor-wrapper :global(.tiptap-mathematics-render) {
    cursor: pointer;
  }

  .editor-wrapper :global([data-type="block-math"]) {
    display: block;
    margin: 32px auto;
    text-align: center;
  }

  .editor-wrapper :global(.ProseMirror-selectednode) {
    outline: 2px solid #9abcb2;
    outline-offset: 3px;
    border-radius: 4px;
  }

  .editor-wrapper :global(.katex) {
    color: #fafaf7;
  }

  @media (max-width: 760px) {
    .editor-shell {
      padding: 20px 12px 56px;
    }

    .page-shadow {
      width: calc(100vw - 24px);
      min-height: calc(100vh - 166px);
    }

    .editor-wrapper :global(.mogan-editor-surface) {
      padding: 54px 24px 84px;
      font-size: 19px;
    }
  }
</style>
