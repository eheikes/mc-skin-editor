import { writable } from 'svelte/store';
import { skinStore, type SkinSnapshot } from './skin';

const MAX_HISTORY = 50;

let undoStack: SkinSnapshot[] = [];
let redoStack: SkinSnapshot[] = [];
let pendingBefore: SkinSnapshot | null = null;

export const canUndo = writable(false);
export const canRedo = writable(false);

function refreshFlags() {
  canUndo.set(undoStack.length > 0);
  canRedo.set(redoStack.length > 0);
}

function samePixels(a: SkinSnapshot, b: SkinSnapshot): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  for (let i = 0; i < a.pixels.length; i++) {
    if (a.pixels[i] !== b.pixels[i]) return false;
  }
  return true;
}

/** Call once, before a discrete edit (pointer-down of a paint stroke, a fill click, a resolution/model change). */
export function beginAction() {
  pendingBefore = skinStore.snapshot();
}

/** Call once the edit is finished (pointer-up). Pushes to the undo stack only if something actually changed. */
export function commitAction() {
  if (!pendingBefore) return;
  const after = skinStore.snapshot();
  if (!samePixels(pendingBefore, after)) {
    undoStack.push(pendingBefore);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
  }
  pendingBefore = null;
  refreshFlags();
}

export function undo() {
  if (undoStack.length === 0) return;
  const prev = undoStack.pop()!;
  redoStack.push(skinStore.snapshot());
  skinStore.restoreSnapshot(prev);
  refreshFlags();
}

export function redo() {
  if (redoStack.length === 0) return;
  const next = redoStack.pop()!;
  undoStack.push(skinStore.snapshot());
  skinStore.restoreSnapshot(next);
  refreshFlags();
}

/** Wipes all history — used by New Skin / Reset Skin / switching saved skins. */
export function clearHistory() {
  undoStack = [];
  redoStack = [];
  pendingBefore = null;
  refreshFlags();
}
