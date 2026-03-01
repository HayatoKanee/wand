/**
 * useFeed — subscribe to the current feed state.
 *
 * Returns the list of scene entries and streaming status.
 * Used internally by WandFeed; consumers rarely need this directly.
 */

import { useStore } from "zustand"
import { useWandStore } from "../context"
import type { SceneEntry } from "../store"

export function useFeed(): {
  scenes: SceneEntry[]
  isStreaming: boolean
} {
  const store = useWandStore()
  const scenes = useStore(store, (s) => s.scenes)
  const isStreaming = useStore(store, (s) => s.isStreaming)
  return { scenes, isStreaming }
}
