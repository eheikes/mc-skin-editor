<script lang="ts">
  import { paletteStore, SLOT_COUNT } from '../lib/stores/palette';
  import { activeColorHex } from '../lib/stores/tool';

  function onSlotClick(index: number) {
    const color = $paletteStore[index];
    if (color) {
      activeColorHex.set(color);
    } else {
      paletteStore.setSlot(index, $activeColorHex);
    }
  }

  $: isEmpty = $paletteStore.every((c) => !c);

  function clearAll() {
    if (!confirm('Clear all palette slots? This cannot be undone.')) return;
    paletteStore.clearAll();
  }

  function onSlotContextMenu(e: MouseEvent, index: number) {
    e.preventDefault();
    paletteStore.setSlot(index, $activeColorHex);
  }

  // Touch has no right-click (and iOS never fires contextmenu), so a
  // long-press overwrites the slot instead. The click that follows the
  // long-press is swallowed so it doesn't immediately pick the color too.
  const LONG_PRESS_MS = 500;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let longPressed = false;

  function onSlotPointerDown(e: PointerEvent, index: number) {
    longPressed = false;
    if (e.pointerType !== 'touch') return;
    pressTimer = setTimeout(() => {
      longPressed = true;
      paletteStore.setSlot(index, $activeColorHex);
      navigator.vibrate?.(20);
    }, LONG_PRESS_MS);
  }

  function cancelLongPress() {
    clearTimeout(pressTimer);
  }

  function onClick(index: number) {
    if (longPressed) {
      longPressed = false;
      return;
    }
    onSlotClick(index);
  }
</script>

<div class="palette">
  <div class="header">
    <div class="palette-label">Palette</div>
    <button type="button" class="clear-btn" on:click={clearAll} disabled={isEmpty} title="Clear all palette slots">
      Clear
    </button>
  </div>
  <div class="palette-grid">
    {#each Array(SLOT_COUNT) as _, i}
      <button
        type="button"
        class="slot"
        class:empty={!$paletteStore[i]}
        style={$paletteStore[i] ? `background:${$paletteStore[i]};` : ''}
        title={$paletteStore[i] ? $paletteStore[i]! : 'Empty — click to store the current color'}
        on:click={() => onClick(i)}
        on:contextmenu={(e) => onSlotContextMenu(e, i)}
        on:pointerdown={(e) => onSlotPointerDown(e, i)}
        on:pointerup={cancelLongPress}
        on:pointercancel={cancelLongPress}
        on:pointerleave={cancelLongPress}
      ></button>
    {/each}
  </div>
  <p class="hint">
    Click empty slot to save · <span class="mouse-hint">right-click</span><span class="touch-hint">long-press</span> to overwrite
  </p>
</div>

<style>
  .palette {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .clear-btn {
    padding: 2px 0 2px 6px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--accent, #7fb0ff);
    font-size: 12px;
    cursor: pointer;
  }
  .clear-btn:hover:not(:disabled) {
    text-decoration: underline;
  }
  .clear-btn:disabled {
    color: var(--text-dim, #9a9ba3);
    cursor: default;
  }
  .palette-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.7;
  }
  .palette-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .slot {
    aspect-ratio: 1;
    border-radius: 5px;
    border: 1px solid var(--border, #555);
    cursor: pointer;
    padding: 0;
    -webkit-touch-callout: none;
    user-select: none;
  }
  .slot.empty {
    background-image:
      linear-gradient(45deg, #666 25%, transparent 25%),
      linear-gradient(-45deg, #666 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #666 75%),
      linear-gradient(-45deg, transparent 75%, #666 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0;
    background-color: #3a3a3a;
  }
  .slot:hover {
    outline: 2px solid var(--accent, #7fb0ff);
    outline-offset: 1px;
  }
  .hint {
    font-size: 11px;
    opacity: 0.55;
    margin: 0;
  }
  .touch-hint {
    display: none;
  }

  /* Wide pane (small-screen layout, portrait): two rows of slots. */
  @container (min-width: 300px) {
    .palette-grid {
      grid-template-columns: repeat(8, 1fr);
    }
  }

  @media (pointer: coarse) {
    .mouse-hint {
      display: none;
    }
    .touch-hint {
      display: inline;
    }
    .palette-grid {
      gap: 8px;
    }
    .clear-btn {
      min-height: 36px;
      padding: 0 0 0 10px;
      font-size: 14px;
    }
  }
</style>
