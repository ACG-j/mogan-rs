<script lang="ts">
  import Editor from "./editor/Editor.svelte";

  let typstSource = $state("");

  const menus = ["文件", "编辑", "插入", "焦点", "格式", "文档", "查看", "转到", "工具", "帮助"];
  const fontSizes = ["10", "12", "14", "18"];
  const zoomLevels = ["100%", "125%", "150%"];
</script>

<main class="app-shell">
  <header class="window-chrome" aria-label="Mogan window chrome">
    <div class="titlebar">
      <div class="traffic-lights" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="app-title">Mogan STEM</div>
      <div class="window-actions" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <div class="tabbar">
      <div class="document-tab active">全微分.tmu</div>
    </div>

    <nav class="menubar" aria-label="Application menu">
      {#each menus as menu}
        <button type="button">{menu}</button>
      {/each}
    </nav>

    <div class="toolbar" aria-label="Document toolbar">
      <button type="button" class="tool-select">样式</button>
      <button type="button" class="tool-select">深色</button>
      <button type="button" class="tool-select">preview-ref</button>
      <button type="button" class="tool-select">A4</button>
      <button type="button" class="tool-select">中文</button>
      <span class="separator"></span>
      <button type="button" class="tool-button" aria-label="Bold">B</button>
      <button type="button" class="tool-button italic" aria-label="Italic">I</button>
      <button type="button" class="tool-button" aria-label="Underline">U</button>
      <span class="separator"></span>
      <button type="button" class="tool-select">Times</button>
      <div class="compact-group" aria-label="Font size">
        {#each fontSizes as size}
          <button type="button" class:active={size === "10"}>{size}</button>
        {/each}
      </div>
      <span class="separator"></span>
      <div class="compact-group" aria-label="Zoom">
        {#each zoomLevels as level}
          <button type="button" class:active={level === "125%"}>{level}</button>
        {/each}
      </div>
    </div>
  </header>

  <section class="document-workspace" aria-label="Document workspace">
    <Editor
      onDocumentChange={(payload) => {
        typstSource = payload.typst;
      }}
    />
  </section>

  <footer class="statusbar">
    <span>text sys-chinese 10 white</span>
    <span>1 / 1</span>
    <span>before doc-data</span>
    <span class="source-count">{typstSource.length} chars</span>
  </footer>
</main>

<style>
  :global(html),
  :global(body),
  :global(#app) {
    height: 100vh;
    margin: 0;
    overflow: hidden;
  }

  :global(body) {
    background: #252827;
    color: #f0f3f1;
    font-family:
      "Noto Sans CJK SC",
      "Microsoft YaHei",
      "PingFang SC",
      system-ui,
      sans-serif;
  }

  .app-shell {
    display: grid;
    grid-template-rows: auto 1fr 24px;
    height: 100vh;
    min-width: 0;
    overflow: hidden;
    background: #303432;
  }

  .window-chrome {
    display: grid;
    grid-template-rows: 28px 31px 30px 38px;
    border-bottom: 1px solid #181b1a;
    background: #2c302f;
    box-shadow: 0 1px 0 rgb(255 255 255 / 8%) inset;
    user-select: none;
  }

  .titlebar {
    display: grid;
    grid-template-columns: 96px 1fr 96px;
    align-items: center;
    padding: 0 11px;
    color: #d6dcda;
    font-size: 12px;
  }

  .traffic-lights,
  .window-actions {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .traffic-lights span,
  .window-actions span {
    width: 11px;
    height: 11px;
    border: 1px solid rgb(0 0 0 / 35%);
    border-radius: 50%;
    background: #5a615e;
  }

  .traffic-lights span:nth-child(1) {
    background: #c64d43;
  }

  .traffic-lights span:nth-child(2) {
    background: #c6a13e;
  }

  .traffic-lights span:nth-child(3) {
    background: #4b9b63;
  }

  .window-actions {
    justify-content: flex-end;
  }

  .app-title {
    text-align: center;
    font-weight: 600;
    letter-spacing: 0;
  }

  .tabbar {
    display: flex;
    align-items: end;
    gap: 4px;
    padding: 0 12px;
    border-top: 1px solid rgb(255 255 255 / 5%);
    border-bottom: 1px solid #1f2221;
    background: #242827;
  }

  .document-tab {
    display: flex;
    align-items: center;
    height: 26px;
    min-width: 142px;
    padding: 0 18px;
    border: 1px solid #171a19;
    border-bottom: 0;
    background: #303533;
    color: #d6dcda;
    font-size: 12px;
  }

  .document-tab.active {
    background: #3a403d;
    color: #ffffff;
  }

  .menubar,
  .toolbar {
    display: flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
    padding: 0 9px;
    border-bottom: 1px solid #202322;
  }

  .menubar {
    gap: 2px;
    background: #363b39;
  }

  .menubar button,
  .toolbar button {
    height: 24px;
    border: 0;
    color: #e8ecea;
    background: transparent;
    font: inherit;
    cursor: default;
  }

  .menubar button {
    padding: 0 9px;
    font-size: 13px;
  }

  .menubar button:hover,
  .toolbar button:hover {
    background: #4b5250;
  }

  .toolbar {
    gap: 5px;
    background: #3d4340;
    color: #e3e7e5;
    font-size: 12px;
  }

  .tool-select,
  .tool-button,
  .compact-group {
    border: 1px solid #202423;
    background: #4a514e;
    box-shadow: 0 1px 0 rgb(255 255 255 / 7%) inset;
  }

  .tool-select {
    min-width: 54px;
    padding: 0 9px;
    text-align: left;
  }

  .tool-button {
    width: 28px;
    padding: 0;
    text-align: center;
    font-weight: 700;
  }

  .italic {
    font-style: italic;
  }

  .compact-group {
    display: flex;
    height: 24px;
  }

  .compact-group button {
    min-width: 34px;
    height: 22px;
    padding: 0 6px;
    border-left: 1px solid #2a2f2d;
  }

  .compact-group button:first-child {
    border-left: 0;
  }

  .compact-group button.active {
    background: #66706b;
  }

  .separator {
    width: 1px;
    height: 22px;
    margin: 0 3px;
    background: #262b29;
    box-shadow: 1px 0 0 rgb(255 255 255 / 8%);
  }

  .document-workspace {
    min-height: 0;
    overflow: hidden;
    background:
      linear-gradient(90deg, rgb(0 0 0 / 10%) 0, transparent 18%, transparent 82%, rgb(0 0 0 / 10%) 100%),
      #343836;
  }

  .statusbar {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) 80px minmax(160px, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
    border-top: 1px solid #171a19;
    background: #2a2e2c;
    color: #d5dbd8;
    font-size: 12px;
  }

  .statusbar span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .statusbar span:nth-child(2) {
    text-align: center;
  }

  .source-count {
    color: #aeb8b4;
  }

  @media (max-width: 760px) {
    .window-chrome {
      grid-template-rows: 28px 31px 30px 34px;
    }

    .toolbar {
      overflow-x: auto;
    }

    .statusbar {
      grid-template-columns: 1fr auto;
    }

    .statusbar span:nth-child(3),
    .statusbar span:nth-child(4) {
      display: none;
    }
  }
</style>
