/**
 * useWand — the primary hook for making components AI-controllable.
 *
 * Registers the component as an "actor" on the Wand stage with named actions.
 * When the AI outputs { target: id, do: actionName }, the corresponding
 * handler is called.
 *
 * @example
 * ```tsx
 * function BaziChart({ pillars }) {
 *   const [highlights, setHighlights] = useState({})
 *
 *   useWand("bazi-chart", {
 *     highlight: ({ positions, color }) => {
 *       setHighlights(h => {
 *         const next = { ...h }
 *         positions.forEach(p => next[p] = color)
 *         return next
 *       })
 *     },
 *     reset: () => setHighlights({}),
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */

import { useEffect, useRef, useMemo } from "react"
import type { ActionHandler } from "@anthropic-ai/wand-core"
import { useOptionalWandStore } from "../context"

export function useWand(
  id: string,
  actions: Record<string, ActionHandler>,
  description?: string,
): void {
  const store = useOptionalWandStore()

  // Keep a ref to the latest actions to avoid re-registering on every render
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  // Create stable wrapper functions that delegate to the ref
  const stableActions = useMemo(() => {
    const stable: Record<string, ActionHandler> = {}
    for (const key of Object.keys(actions)) {
      stable[key] = (args: Record<string, unknown>) => {
        actionsRef.current[key]?.(args)
      }
    }
    return stable
    // Re-create stable wrappers only when the set of action names changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(actions).sort().join(",")])

  useEffect(() => {
    if (!store) return
    store.getState().register(id, stableActions, description)
    return () => {
      store.getState().unregister(id)
    }
  }, [store, id, stableActions, description])
}
