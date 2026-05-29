<script lang="ts">
  import Editor from "./editor/Editor.svelte";
  import Preview from "./preview/Preview.svelte";
  import { invoke } from "@tauri-apps/api/core";
</script>

<main class="app-container">
  <div class="editor-pane">
    <Editor />
  </div>
  <div class="preview-pane">
    <Preview />
  </div>
</main>

<style>
  .app-container {
    display: flex;
    height: 100vh;
    margin: 0;
    padding: 0;
  }

  .editor-pane {
    flex: 1;
    border-right: 1px solid #e0e0e0;
    overflow: hidden;
  }

  .preview-pane {
    flex: 1;
    overflow: auto;
    padding: 1rem;
    background: #fafafa;
  }
</style>
