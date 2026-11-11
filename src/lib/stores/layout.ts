import { writable } from 'svelte/store'
import { loadJSON, saveJSON } from '../persist'

// On small screens (see the COMPACT media query in App.svelte), only one side
// pane is shown at a time — or none, to give the 3D viewport the whole screen.
// On larger screens every pane is always visible and this store is ignored.
export type PaneId = 'tools' | 'color' | 'palette' | 'layers' | 'texture'

const KEY = 'mcSkinEditor.activePane'

export const activePane = writable<PaneId | null>(loadJSON<PaneId | null>(KEY, 'tools'))
activePane.subscribe((v) => saveJSON(KEY, v))

export function togglePane (id: PaneId): void {
  activePane.update((current) => (current === id ? null : id))
}
