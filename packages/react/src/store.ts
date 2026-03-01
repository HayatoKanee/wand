/**
 * WandStore — Zustand store as the central command bus.
 *
 * Serves three roles:
 * 1. Actor registry — tracks what components are on stage and their actions
 * 2. Command dispatch — routes AI actions to the right component handlers
 * 3. Feed state — accumulated scene items (text, primitives, widgets, suggestions)
 *
 * Works both inside and outside React (streaming handlers can dispatch directly).
 */

import { createStore } from "zustand/vanilla"
import type {
  Action,
  SpawnDirective,
  CreateDirective,
  ActionHandler,
  Scene,
} from "@anthropic-ai/wand-core"

// -- Actor Registration --

interface ActorEntry {
  readonly id: string
  readonly actions: Map<string, ActionHandler>
  readonly actionNames: readonly string[]
  readonly description?: string
}

// -- Feed Items --

export type FeedItem =
  | { readonly type: "text"; readonly content: string }
  | { readonly type: "primitive"; readonly directive: CreateDirective }
  | { readonly type: "widget"; readonly directive: SpawnDirective }

// -- Scene Entry (one per AI response) --

export interface SceneEntry {
  readonly id: string
  readonly items: readonly FeedItem[]
  readonly suggestions: readonly string[]
  readonly complete: boolean
}

// -- Store State --

export interface WandState {
  // Actor registry
  actors: Map<string, ActorEntry>

  // Feed state
  scenes: SceneEntry[]
  currentSceneId: string | null
  isStreaming: boolean

  // Registered widgets (for spawn)
  widgets: Map<string, WidgetRegistration>
}

export interface WidgetRegistration {
  readonly name: string
  readonly description: string
  readonly component: React.ComponentType<{ data: Record<string, unknown> }>
}

// -- Store Actions --

export interface WandActions {
  // Actor lifecycle
  register(
    id: string,
    actions: Record<string, ActionHandler>,
    description?: string,
  ): void
  unregister(id: string): void

  // AI command dispatch
  dispatch(action: Action): void

  // Feed mutations
  startScene(): string
  appendText(sceneId: string, text: string): void
  addPrimitive(sceneId: string, directive: CreateDirective): void
  addWidget(sceneId: string, directive: SpawnDirective): void
  setSuggestions(sceneId: string, suggestions: readonly string[]): void
  completeScene(sceneId: string): void

  // Widget registration
  registerWidget(registration: WidgetRegistration): void

  // Stage context
  getActorSummaries(): Array<{ id: string; actions: string[]; description?: string }>
  getWidgetSummaries(): Array<{ name: string; description: string }>
}

export type WandStore = WandState & WandActions

let sceneCounter = 0

export function createWandStore() {
  return createStore<WandStore>((set, get) => ({
    // Initial state
    actors: new Map(),
    scenes: [],
    currentSceneId: null,
    isStreaming: false,
    widgets: new Map(),

    // -- Actor lifecycle --

    register(id, actions, description) {
      set((state) => {
        const next = new Map(state.actors)
        next.set(id, {
          id,
          actions: new Map(Object.entries(actions)),
          actionNames: Object.keys(actions),
          description,
        })
        return { actors: next }
      })
    },

    unregister(id) {
      set((state) => {
        const next = new Map(state.actors)
        next.delete(id)
        return { actors: next }
      })
    },

    // -- Command dispatch --

    dispatch(action) {
      const { actors } = get()
      const actor = actors.get(action.target)
      if (!actor) return

      const handler = actor.actions.get(action.do)
      if (!handler) return

      handler(action.args ?? {})
    },

    // -- Feed mutations --

    startScene() {
      const id = `scene-${++sceneCounter}`
      set((state) => ({
        scenes: [
          ...state.scenes,
          { id, items: [], suggestions: [], complete: false },
        ],
        currentSceneId: id,
        isStreaming: true,
      }))
      return id
    },

    appendText(sceneId, text) {
      set((state) => ({
        scenes: state.scenes.map((s) => {
          if (s.id !== sceneId) return s
          const items = [...s.items]
          const last = items[items.length - 1]
          // If trailing item is text → replace (streaming accumulation)
          // Otherwise (widget/primitive or empty) → push new text segment
          if (last?.type === "text") {
            items[items.length - 1] = { type: "text", content: text }
          } else {
            items.push({ type: "text", content: text })
          }
          return { ...s, items }
        }),
      }))
    },

    addPrimitive(sceneId, directive) {
      set((state) => ({
        scenes: state.scenes.map((s) =>
          s.id === sceneId
            ? { ...s, items: [...s.items, { type: "primitive", directive }] }
            : s,
        ),
      }))
    },

    addWidget(sceneId, directive) {
      set((state) => ({
        scenes: state.scenes.map((s) =>
          s.id === sceneId
            ? { ...s, items: [...s.items, { type: "widget", directive }] }
            : s,
        ),
      }))
    },

    setSuggestions(sceneId, suggestions) {
      set((state) => ({
        scenes: state.scenes.map((s) =>
          s.id === sceneId ? { ...s, suggestions: [...suggestions] } : s,
        ),
      }))
    },

    completeScene(sceneId) {
      set((state) => ({
        scenes: state.scenes.map((s) =>
          s.id === sceneId ? { ...s, complete: true } : s,
        ),
        isStreaming: false,
      }))
    },

    // -- Widget registration --

    registerWidget(registration) {
      set((state) => {
        const next = new Map(state.widgets)
        next.set(registration.name, registration)
        return { widgets: next }
      })
    },

    // -- Stage context --

    getActorSummaries() {
      const { actors } = get()
      return Array.from(actors.values()).map((a) => ({
        id: a.id,
        actions: [...a.actionNames],
        description: a.description,
      }))
    },

    getWidgetSummaries() {
      const { widgets } = get()
      return Array.from(widgets.values()).map((w) => ({
        name: w.name,
        description: w.description,
      }))
    },
  }))
}
