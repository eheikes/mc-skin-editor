<script lang="ts">
  import { activePane, togglePane, type PaneId } from '../lib/stores/layout';
  import { activeTool, activeColorHex } from '../lib/stores/tool';
  import { canUndo, canRedo, undo, redo } from '../lib/stores/history';

  const toolIcons: Record<string, string> = { pencil: '✏️', eraser: '🧹', eyedropper: '💧', fill: '🪣' };

  const panes: { id: PaneId; label: string }[] = [
    { id: 'tools', label: 'Tools' },
    { id: 'color', label: 'Color' },
    { id: 'palette', label: 'Palette' },
    { id: 'layers', label: 'Layers' },
    { id: 'texture', label: 'Texture' }
  ];
</script>

<!-- Only shown on small screens; see the COMPACT media query in App.svelte. -->
<nav class="pane-switcher" aria-label="Panels">
  {#each panes as p (p.id)}
    <button
      type="button"
      class="pane-btn"
      class:active={$activePane === p.id}
      aria-pressed={$activePane === p.id}
      title={$activePane === p.id ? `Hide ${p.label}` : `Show ${p.label}`}
      on:click={() => togglePane(p.id)}
    >
      <span class="icon" aria-hidden="true">
        {#if p.id === 'tools'}
          {toolIcons[$activeTool]}
        {:else if p.id === 'color'}
          <span class="color-dot" style="background: {$activeColorHex};"></span>
        {:else if p.id === 'palette'}
          🎨
        {:else if p.id === 'layers'}
          <svg viewBox="0 0 16 32" class="figure">
            <rect x="4" y="0" width="8" height="8" />
            <rect x="0" y="9" width="3" height="11" />
            <rect x="4" y="9" width="8" height="11" />
            <rect x="13" y="9" width="3" height="11" />
            <rect x="4" y="21" width="3.5" height="11" />
            <rect x="8.5" y="21" width="3.5" height="11" />
          </svg>
        {:else}
          <svg viewBox="0 0 16 16" class="grid-icon">
            <rect x="0.5" y="0.5" width="15" height="15" rx="1" />
            <path d="M5.5 0.5v15M10.5 0.5v15M0.5 5.5h15M0.5 10.5h15" />
          </svg>
        {/if}
      </span>
      <span class="label">{p.label}</span>
    </button>
  {/each}

  <span class="spacer"></span>

  <button type="button" class="pane-btn" on:click={undo} disabled={!$canUndo} title="Undo (Ctrl+Z)">
    <span class="icon" aria-hidden="true">↶</span>
    <span class="label">Undo</span>
  </button>
  <button type="button" class="pane-btn" on:click={redo} disabled={!$canRedo} title="Redo (Ctrl+Y)">
    <span class="icon" aria-hidden="true">↷</span>
    <span class="label">Redo</span>
  </button>
</nav>

<style>
  .pane-switcher {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 100%;
  }
  .spacer {
    flex: 1;
    min-height: 6px;
  }
  .pane-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 56px;
    min-height: 52px;
    padding: 4px 2px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text, #eee);
    cursor: pointer;
    font-size: 10px;
    -webkit-tap-highlight-color: transparent;
  }
  .pane-btn:hover:not(:disabled) {
    background: var(--panel-bg-hover, #444);
  }
  .pane-btn.active {
    border-color: var(--accent, #7fb0ff);
    background: var(--accent-bg, #2b4a6b);
  }
  .pane-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    font-size: 20px;
    line-height: 1;
  }
  .color-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid var(--text, #eee);
  }
  .figure {
    height: 22px;
    fill: currentColor;
    opacity: 0.85;
  }
  .grid-icon {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1;
    opacity: 0.85;
  }
  .label {
    opacity: 0.8;
  }

  /* Short landscape screens (phones on their side): icons only, so the
     whole rail fits without scrolling. */
  @media (orientation: landscape) and (max-height: 480px) {
    .pane-switcher {
      gap: 2px;
    }
    .spacer {
      min-height: 0;
    }
    .pane-btn {
      width: 48px;
      min-height: 40px;
    }
    .label {
      display: none;
    }
  }

  /* Portrait: a bottom tab bar instead of a left rail. */
  @media (orientation: portrait) {
    .pane-switcher {
      flex-direction: row;
      justify-content: space-between;
      gap: 2px;
    }
    .spacer {
      min-height: 0;
      max-width: 12px;
    }
    .pane-btn {
      flex: 1 1 0;
      width: auto;
      min-width: 0;
      max-width: 72px;
    }
  }
</style>
