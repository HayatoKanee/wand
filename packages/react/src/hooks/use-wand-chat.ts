/**
 * useWandChat — hook for sending messages and triggering AI scene generation.
 *
 * Connects to the AI via the adapter, orchestrates the scene, and updates
 * the Zustand store as events stream in.
 *
 * Can be used standalone (pass adapter explicitly) or within a WandProvider
 * (adapter is read from context automatically).
 */

import { useCallback, useRef, useState } from "react"
import {
  orchestrateScene,
  type AIPort,
  type AIMessage,
  type StageContext,
  PRIMITIVE_TYPES,
} from "@anthropic-ai/wand-core"
import { useWandStore, useWandConfig } from "../context"

interface UseWandChatOptions {
  adapter?: AIPort
  systemPrompt?: string
}

export function useWandChat(options: UseWandChatOptions = {}) {
  const store = useWandStore()
  const config = useWandConfig()

  // Prefer explicit options over context
  const adapter = options.adapter ?? config.adapter
  const systemPrompt = options.systemPrompt ?? config.systemPrompt

  const [input, setInput] = useState("")
  const historyRef = useRef<AIMessage[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(
    async (message: string) => {
      if (!message.trim()) return

      const state = store.getState()

      // Wire up abort controller
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      // Build context
      const context: StageContext = {
        actors: state.getActorSummaries(),
        widgets: state.getWidgetSummaries(),
        primitives: [...PRIMITIVE_TYPES],
        systemPrompt: systemPrompt ?? "",
      }

      // Build messages
      const messages: AIMessage[] = [
        ...historyRef.current,
        { role: "user", content: message },
      ]

      // Start a new scene in the feed
      const sceneId = state.startScene()

      // Create a lightweight StagePort that routes to our Zustand store
      const stagePort = {
        getActors: () => {
          const actorMap = new Map<string, { actions: readonly string[] }>()
          for (const [id, actor] of state.actors) {
            actorMap.set(id, { actions: actor.actionNames })
          }
          return actorMap
        },
        dispatch: (action: Parameters<typeof state.dispatch>[0]) => {
          state.dispatch(action)
        },
        mountWidget: (directive: Parameters<typeof state.addWidget>[1]) => {
          store.getState().addWidget(sceneId, directive)
        },
        renderPrimitive: (directive: Parameters<typeof state.addPrimitive>[1]) => {
          store.getState().addPrimitive(sceneId, directive)
        },
      }

      // Orchestrate
      try {
        for await (const event of orchestrateScene(
          { aiPort: adapter, stagePort },
          messages,
          context,
        )) {
          // Check abort
          if (controller.signal.aborted) break

          switch (event.type) {
            case "text-delta":
              store.getState().appendText(sceneId, event.text)
              break
            case "suggestions":
              store.getState().setSuggestions(sceneId, event.suggestions)
              break
            case "scene-complete":
              // Add assistant message to history
              historyRef.current = [
                ...messages,
                {
                  role: "assistant",
                  content: event.scene.text ?? "",
                },
              ]
              break
          }
        }
      } finally {
        store.getState().completeScene(sceneId)
        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    },
    [store, adapter, systemPrompt],
  )

  const handleSubmit = useCallback(
    (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.()
      const msg = input.trim()
      if (msg) {
        setInput("")
        send(msg)
      }
    },
    [input, send],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  return { input, setInput, send, handleSubmit, stop }
}
