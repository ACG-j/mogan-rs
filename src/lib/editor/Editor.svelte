<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import "katex/dist/katex.min.css";
  import { StructuredMathematics } from "./mathExtension";
  import {
    cycleTextBeforeCursor,
    cycleSelectedMath,
    focusSelectedMathSlot,
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
      event.preventDefault();
      const handled = focusSelectedMathSlot(editor, event.shiftKey ? "backward" : "forward") || cycleSelectedMath(editor) || cycleTextBeforeCursor(editor);
      if (handled) {
        emitDocumentChange();
      }
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? "backward" : "forward";
      if (focusSelectedMathSlot(editor, direction)) {
        event.preventDefault();
        return;
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

  .editor-wrapper :global(.structured-math) {
    color: #fafaf7;
    font-family: KaTeX_Math, "Times New Roman", "Noto Serif CJK SC", serif;
    font-style: italic;
    white-space: nowrap;
    cursor: text;
  }

  .editor-wrapper :global(.structured-math--block) {
    display: block;
    margin: 32px auto;
    text-align: center;
  }

  .editor-wrapper :global(.structured-math--inline) {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }

  .editor-wrapper :global(.math-row) {
    display: inline-flex;
    align-items: center;
    gap: 0;
  }

  .editor-wrapper :global(.math-edit-slot) {
    display: inline-block;
    min-width: 0.45em;
    min-height: 1.1em;
    padding: 0;
    border-radius: 2px;
    outline: none;
    caret-color: #ffffff;
    text-align: center;
  }

  .editor-wrapper :global(.math-edit-slot:focus) {
    background: rgb(154 188 178 / 18%);
    box-shadow: 0 0 0 1px rgb(154 188 178 / 75%);
  }

  .editor-wrapper :global(.math-edit-slot:empty::before) {
    content: attr(data-placeholder);
    color: rgb(255 255 255 / 38%);
  }

  .editor-wrapper :global(.math-frac) {
    --frac-width: auto;
    --frac-sep: 0.08em;
    --frac-rule-width: 0.045em;
    --frac-axis-shift: 0px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-items: center;
    width: var(--frac-width);
    margin: 0 0.08em;
    line-height: 1;
    transform: translateY(var(--frac-axis-shift));
    vertical-align: middle;
  }

  .editor-wrapper :global(.math-frac-slot) {
    min-width: 0.7em;
    padding: 0;
    line-height: 1.02;
  }

  .editor-wrapper :global(.math-frac-rule) {
    display: block;
    width: 100%;
    height: 0;
    margin: var(--frac-sep) 0 calc(var(--frac-sep) * 0.82);
    border-top: var(--frac-rule-width) solid currentColor;
  }

  .editor-wrapper :global(.math-frac-denominator) {
    padding-top: 0;
  }

  .editor-wrapper :global(.math-sqrt) {
    --sqrt-scale: 1.12;
    --sqrt-gap: 0.055em;
    display: inline-flex;
    align-items: flex-end;
    margin: 0 0.08em;
    vertical-align: middle;
  }

  .editor-wrapper :global(.math-sqrt-index) {
    align-self: flex-start;
    margin-right: -0.15em;
    font-size: 0.62em;
  }

  .editor-wrapper :global(.math-sqrt-radical) {
    font-size: calc(1em * var(--sqrt-scale));
    line-height: 1;
    transform-origin: 100% 100%;
  }

  .editor-wrapper :global(.math-sqrt-body) {
    min-width: 1em;
    padding: var(--sqrt-gap) 0.14em 0;
    border-top: 0.045em solid currentColor;
  }

  .editor-wrapper :global(.math-script) {
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    line-height: 1;
  }

  .editor-wrapper :global(.math-script-slots) {
    --script-x: 0px;
    --script-y: -0.08em;
    display: inline-grid;
    grid-template-rows: auto auto;
    align-items: center;
    margin-left: 0.01em;
    font-size: 0.68em;
    line-height: 0.95;
    transform: translate(var(--script-x), var(--script-y));
  }

  .editor-wrapper :global(.math-script-sup) {
    align-self: start;
  }

  .editor-wrapper :global(.math-script-sub) {
    align-self: end;
  }

  .editor-wrapper :global(.math-script--sup-only .math-script-slots) {
    grid-template-rows: auto;
  }

  .editor-wrapper :global(.math-script--sub-only .math-script-slots) {
    grid-template-rows: auto;
  }

  .editor-wrapper :global(.math-neg) {
    display: inline-flex;
    align-items: center;
    gap: 0.12em;
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
