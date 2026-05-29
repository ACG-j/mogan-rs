<script lang="ts">
  import { onMount } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { typst } from "codemirror-lang-typst";
  import { EditorState } from "@codemirror/state";

  let editorContainer: HTMLDivElement;
  let view: EditorView;

  onMount(() => {
    const state = EditorState.create({
      doc: '= Hello, Mogan!\n\nType your Typst code here.\n\n$ pi r^2 $',
      extensions: [
        basicSetup,
        typst(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // TODO: send to Tauri backend for compilation
          }
        }),
      ],
    });

    view = new EditorView({
      state,
      parent: editorContainer,
    });
  });
</script>

<div class="editor-wrapper" bind:this={editorContainer}>
</div>

<style>
  .editor-wrapper {
    height: 100%;
    overflow: auto;
  }

  .editor-wrapper :global(.cm-editor) {
    height: 100%;
  }
</style>
