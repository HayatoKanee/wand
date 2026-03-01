/**
 * useManualStage — bypass AIPort and dispatch scene events directly.
 *
 * For apps that already handle AI calls server-side (BYO-backend pattern).
 * Exposes store dispatch methods so you can push text, widgets, and
 * primitives into the Wand feed from your own streaming handler.
 *
 * @example
 * ```tsx
 * const wand = useManualStage()
 *
 * // In your SSE handler:
 * const sceneId = wand.startScene()
 * wand.appendText(sceneId, "Analyzing...")
 * wand.addWidget(sceneId, { widget: "dayun", data: dayunResponse })
 * wand.completeScene(sceneId)
 * ```
 */

import { useMemo } from "react"
import type { Action, SpawnDirective, CreateDirective } from "@anthropic-ai/wand-core"
import { useOptionalWandStore } from "../context"

export interface ManualStage {
  dispatch: (action: Action) => void
  startScene: () => string
  appendText: (sceneId: string, text: string) => void
  addWidget: (sceneId: string, directive: SpawnDirective) => void
  addPrimitive: (sceneId: string, directive: CreateDirective) => void
  setSuggestions: (sceneId: string, suggestions: string[]) => void
  completeScene: (sceneId: string) => void
}

const NOOP_STAGE: ManualStage = {
  dispatch: () => {},
  startScene: () => "noop",
  appendText: () => {},
  addWidget: () => {},
  addPrimitive: () => {},
  setSuggestions: () => {},
  completeScene: () => {},
}

export function useManualStage(): ManualStage {
  const store = useOptionalWandStore()

  return useMemo(() => {
    if (!store) return NOOP_STAGE
    return {
      dispatch: (action: Action) => store.getState().dispatch(action),
      startScene: () => store.getState().startScene(),
      appendText: (sceneId: string, text: string) =>
        store.getState().appendText(sceneId, text),
      addWidget: (sceneId: string, directive: SpawnDirective) =>
        store.getState().addWidget(sceneId, directive),
      addPrimitive: (sceneId: string, directive: CreateDirective) =>
        store.getState().addPrimitive(sceneId, directive),
      setSuggestions: (sceneId: string, suggestions: string[]) =>
        store.getState().setSuggestions(sceneId, suggestions),
      completeScene: (sceneId: string) =>
        store.getState().completeScene(sceneId),
    }
  }, [store])
}
