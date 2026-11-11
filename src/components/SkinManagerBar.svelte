<script lang="ts">
  import { get } from 'svelte/store';
  import { skinStore } from '../lib/stores/skin';
  import { beginAction, commitAction, clearHistory } from '../lib/stores/history';
  import {
    savedSkins,
    currentSkinId,
    createNewSkin,
    switchToSkin,
    renameSkin,
    deleteSkin,
    duplicateSkin,
    importSkinAsNew
  } from '../lib/stores/savedSkins';
  import { resolutionFromDims } from '../lib/skin/resolutions';
  import { fileToImageData, downloadImageData } from '../lib/png';
  import type { ModelType, ResolutionId } from '../lib/skin/types';
  import SkinDialog from './SkinDialog.svelte';
  import AboutDialog from './AboutDialog.svelte';

  let fileInput: HTMLInputElement;
  let dialogMode: 'new' | 'import' | null = null;
  let pendingImport: { imageData: ImageData; resolution: ResolutionId; name: string } | null = null;
  let renaming = false;
  let renameValue = '';
  let aboutOpen = false;
  let menuOpen = false;
  let menuEl: HTMLDivElement;

  $: currentRecord = $savedSkins.find((s) => s.id === $currentSkinId) ?? null;

  function openNewDialog() {
    dialogMode = 'new';
  }

  function closeDialog() {
    dialogMode = null;
    pendingImport = null;
  }

  function confirmNew(name: string, resolution: ResolutionId, model: ModelType) {
    createNewSkin(name, resolution, model);
    closeDialog();
  }

  function confirmImport(name: string, _resolution: ResolutionId, model: ModelType) {
    if (!pendingImport) return;
    importSkinAsNew(name, pendingImport.resolution, model, pendingImport.imageData);
    closeDialog();
  }

  async function onImportFileChosen(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    let imageData: ImageData;
    try {
      imageData = await fileToImageData(file);
    } catch {
      alert('Could not read that file as an image.');
      return;
    }
    const resolution = resolutionFromDims(imageData.width, imageData.height);
    if (!resolution) {
      alert(
        `Unsupported image size ${imageData.width}×${imageData.height}. Skin PNGs must be 64×32 (legacy), 64×64 (standard), or 128×128 (high).`
      );
      return;
    }
    pendingImport = { imageData, resolution, name: file.name.replace(/\.png$/i, '') };
    dialogMode = 'import';
  }

  function triggerImport() {
    fileInput.click();
  }

  function exportPng() {
    const imageData = skinStore.toImageData();
    const name = currentRecord?.name || 'skin';
    downloadImageData(imageData, `${name.replace(/[^a-z0-9-_]+/gi, '_')}.png`);
  }

  function resetSkin() {
    if (!confirm('Reset the current skin to a blank canvas? You can undo this afterward.')) return;
    const s = get(skinStore);
    beginAction();
    skinStore.newBlank(s.resolution, s.model);
    commitAction();
  }

  function onSwitch(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    switchToSkin(id);
  }

  function startRename() {
    if (!currentRecord) return;
    renameValue = currentRecord.name;
    renaming = true;
  }

  function commitRename() {
    if (currentRecord && renameValue.trim()) {
      renameSkin(currentRecord.id, renameValue.trim());
    }
    renaming = false;
  }

  function onDuplicate() {
    if (currentRecord) duplicateSkin(currentRecord.id);
  }

  // Runs a compact-menu action, closing the menu first so any confirm()
  // dialog it opens isn't stacked on top of the open menu.
  function fromMenu(action: () => void) {
    menuOpen = false;
    action();
  }

  function onWindowPointerDown(e: PointerEvent) {
    if (menuOpen && menuEl && !menuEl.contains(e.target as Node)) menuOpen = false;
  }

  function onDelete() {
    if (!currentRecord) return;
    if ($savedSkins.length <= 1) {
      alert('At least one skin must exist. Create a new skin before deleting this one.');
      return;
    }
    if (!confirm(`Delete "${currentRecord.name}"? This cannot be undone.`)) return;
    deleteSkin(currentRecord.id);
  }
</script>

<svelte:window on:pointerdown={onWindowPointerDown} on:keydown={(e) => e.key === 'Escape' && (menuOpen = false)} />

<div class="manager-bar">
  <div class="skin-select-group">
    {#if renaming}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="rename-input"
        type="text"
        bind:value={renameValue}
        on:blur={commitRename}
        on:keydown={(e) => e.key === 'Enter' && commitRename()}
        autofocus
      />
    {:else}
      <select class="skin-select" value={$currentSkinId ?? ''} on:change={onSwitch} title="Switch skin">
        {#each $savedSkins as s}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>
      <button type="button" class="icon-btn" title="Rename skin" on:click={startRename}>✎</button>
    {/if}
  </div>

  <div class="actions">
    <button type="button" on:click={openNewDialog}>New Skin</button>
    <button type="button" on:click={onDuplicate} disabled={!currentRecord}>Duplicate</button>
    <button type="button" on:click={onDelete} disabled={!currentRecord}>Delete</button>
    <span class="sep"></span>
    <button type="button" on:click={triggerImport}>Import PNG</button>
    <button type="button" class="primary" on:click={exportPng}>Export PNG</button>
    <span class="sep"></span>
    <button type="button" class="danger" on:click={resetSkin}>Reset Skin</button>
    <span class="sep"></span>
    <button type="button" class="icon-btn about-btn" title="About" on:click={() => (aboutOpen = true)}>ⓘ</button>
  </div>

  <!-- Small screens: Export stays visible, everything else goes in a menu. -->
  <div class="compact-actions" bind:this={menuEl}>
    <button type="button" class="primary" on:click={exportPng}>Export</button>
    <button
      type="button"
      class="menu-btn"
      title="More actions"
      aria-label="More actions"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      on:click={() => (menuOpen = !menuOpen)}>⋯</button
    >
    {#if menuOpen}
      <div class="menu" role="menu">
        <button type="button" role="menuitem" on:click={() => fromMenu(openNewDialog)}>New Skin</button>
        <button type="button" role="menuitem" on:click={() => fromMenu(onDuplicate)} disabled={!currentRecord}
          >Duplicate</button
        >
        <button type="button" role="menuitem" on:click={() => fromMenu(onDelete)} disabled={!currentRecord}
          >Delete</button
        >
        <span class="menu-sep"></span>
        <button type="button" role="menuitem" on:click={() => fromMenu(triggerImport)}>Import PNG</button>
        <button type="button" role="menuitem" on:click={() => fromMenu(exportPng)}>Export PNG</button>
        <span class="menu-sep"></span>
        <button type="button" role="menuitem" class="danger" on:click={() => fromMenu(resetSkin)}>Reset Skin</button>
        <span class="menu-sep"></span>
        <button type="button" role="menuitem" on:click={() => fromMenu(() => (aboutOpen = true))}>About</button>
      </div>
    {/if}
  </div>

  <input
    bind:this={fileInput}
    type="file"
    accept="image/png"
    style="display:none"
    on:change={onImportFileChosen}
  />
</div>

{#if dialogMode === 'new'}
  <SkinDialog
    title="New Skin"
    confirmLabel="Create"
    allowResolutionChange={true}
    onConfirm={confirmNew}
    onCancel={closeDialog}
  />
{:else if dialogMode === 'import' && pendingImport}
  <SkinDialog
    title="Import Skin"
    confirmLabel="Import"
    initialName={pendingImport.name}
    initialResolution={pendingImport.resolution}
    allowResolutionChange={false}
    onConfirm={confirmImport}
    onCancel={closeDialog}
  />
{/if}

{#if aboutOpen}
  <AboutDialog onClose={() => (aboutOpen = false)} />
{/if}

<style>
  .manager-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 10px 16px;
    background: var(--header-bg, #202225);
    border-bottom: 1px solid var(--border, #444);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .skin-select-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .skin-select,
  .rename-input {
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--border, #555);
    background: var(--input-bg, #222);
    color: var(--text, #eee);
    font-size: 14px;
    min-width: 140px;
  }
  .icon-btn {
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid var(--border, #555);
    background: var(--panel-bg, #333);
    color: var(--text, #eee);
    cursor: pointer;
  }
  .about-btn {
    padding: 5px 12px;
    font-size: 18px;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .actions button {
    padding: 7px 12px;
    border-radius: 6px;
    border: 1px solid var(--border, #555);
    background: var(--panel-bg, #333);
    color: var(--text, #eee);
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
  }
  .actions button:hover:not(:disabled) {
    background: var(--panel-bg-hover, #444);
  }
  .actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .actions button.primary {
    background: var(--accent, #3a7bd5);
    border-color: var(--accent, #3a7bd5);
    color: white;
  }
  .actions button.danger {
    border-color: #a33;
    color: #ff8080;
  }
  .sep {
    width: 1px;
    align-self: stretch;
    background: var(--border, #444);
    margin: 0 4px;
  }

  .compact-actions {
    display: none;
    position: relative;
    align-items: center;
    gap: 6px;
  }
  .compact-actions > button {
    min-height: 40px;
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid var(--border, #555);
    background: var(--panel-bg, #333);
    color: var(--text, #eee);
    cursor: pointer;
    font-size: 14px;
  }
  .compact-actions > button.primary {
    background: var(--accent, #3a7bd5);
    border-color: var(--accent, #3a7bd5);
    color: white;
  }
  .menu-btn {
    min-width: 44px;
    font-size: 20px !important;
    line-height: 1;
  }
  .menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    min-width: 180px;
    padding: 6px;
    border-radius: 8px;
    border: 1px solid var(--border, #555);
    background: var(--panel-bg, #333);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }
  .menu button {
    min-height: 44px;
    padding: 0 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text, #eee);
    font-size: 15px;
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover:not(:disabled) {
    background: var(--panel-bg-hover, #444);
  }
  .menu button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .menu button.danger {
    color: #ff8080;
  }
  .menu-sep {
    height: 1px;
    margin: 4px 0;
    background: var(--border, #444);
  }

  /* COMPACT layout — keep in sync with App.svelte. */
  @media (max-width: 1024px), (max-height: 640px) {
    .manager-bar {
      flex-wrap: nowrap;
      gap: 8px;
      padding: 6px 8px;
    }
    .skin-select-group {
      flex: 1;
      min-width: 0;
    }
    .skin-select,
    .rename-input {
      flex: 1;
      min-width: 0;
      max-width: 320px;
      min-height: 40px;
      font-size: 16px; /* 16px+ keeps iOS from zooming in on focus */
    }
    .icon-btn {
      min-width: 40px;
      min-height: 40px;
    }
    .actions {
      display: none;
    }
    .compact-actions {
      display: flex;
    }
  }
</style>
