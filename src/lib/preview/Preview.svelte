<script lang="ts">
  type Props = {
    documentJson?: unknown;
    typstSource?: string;
  };

  let { documentJson = null, typstSource = "" }: Props = $props();
</script>

<section class="preview-container">
  <div class="preview-header">
    <span>Typst Preview Source</span>
    <span class="status">structured draft</span>
  </div>

  <div class="presentation-page">
    <h1>全微分</h1>
    <p>设 <span class="math">z = f(x,y) = x<sup>y</sup></span>，则</p>
    <p class="math block">dz = ∂z/∂x · dx + ∂z/∂y · dy</p>
    <p class="math block">dz|(e,2) = 2e dx + e²dy</p>
  </div>

  <div class="source-panel">
    <pre>{typstSource || "No document yet."}</pre>
  </div>

  <details class="json-panel">
    <summary>Document JSON</summary>
    <pre>{JSON.stringify(documentJson, null, 2)}</pre>
  </details>
</section>

<style>
  .preview-container {
    display: grid;
    grid-template-rows: auto minmax(260px, 0.9fr) minmax(140px, 0.55fr) auto;
    height: 100%;
    color: #f8faf9;
    background: #383a39;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 42px;
    padding: 0 14px;
    border-bottom: 1px solid rgb(255 255 255 / 12%);
    color: #d7dddb;
    font: 600 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    text-transform: uppercase;
  }

  .status {
    color: #9fb8b1;
    text-transform: none;
  }

  .presentation-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 28px;
    padding: 32px 48px;
    color: #f8f8f7;
    font-family: "Times New Roman", "Noto Serif CJK SC", serif;
    text-align: center;
    border-bottom: 1px solid rgb(255 255 255 / 12%);
  }

  .presentation-page h1 {
    margin: 0 0 20px;
    font-size: 36px;
    line-height: 1.2;
    font-weight: 700;
  }

  .presentation-page p {
    margin: 0;
    font-size: 22px;
  }

  .math {
    font-style: italic;
  }

  .block {
    font-size: 25px;
  }

  .source-panel,
  .json-panel {
    min-height: 0;
    overflow: auto;
    padding: 14px;
    background: #2d302f;
  }

  .source-panel pre,
  .json-panel pre {
    margin: 0;
    white-space: pre-wrap;
    color: #dfe6e3;
    font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }

  .json-panel {
    border-top: 1px solid rgb(255 255 255 / 12%);
  }

  .json-panel summary {
    cursor: pointer;
    color: #b5c4c0;
    font: 600 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
</style>
