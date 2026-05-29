<script lang="ts">
  let svgContent = "";
</script>

<div class="preview-container">
  {#if svgContent}
    {@html svgContent}
  {:else}
    <div class="preview-placeholder">
      <p>Preview</p>
      <p class="hint">Edit your Typst document to see the preview here.</p>
    </div>
  {/if}
</div>

<style>
  .preview-container {
    width: 100%;
    min-height: 100%;
  }

  .preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
  }

  .preview-placeholder p {
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.9rem;
    color: #bbb;
  }
</style>
