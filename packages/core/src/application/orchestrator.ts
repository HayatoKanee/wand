/**
 * SceneOrchestrator — the core use case of Wand.
 *
 * Streams an AI response and progressively applies it to the stage:
 * 1. Actions execute immediately (highlights appear as AI "thinks")
 * 2. Create primitives render as they arrive
 * 3. Text streams word-by-word
 * 4. Spawned widgets render when data is complete
 * 5. Suggestions appear at the end
 *
 * This is pure orchestration — no React, no Anthropic, no OpenAI.
 * It depends only on port interfaces.
 */

import type { Scene, Action, SpawnDirective, CreateDirective } from "../domain/scene"
import { createScene } from "../domain/scene"
import type { AIPort, AIMessage, StageContext } from "../ports/ai-port"
import type { StagePort } from "../ports/stage-port"

/** Dependencies injected into the orchestrator. */
export interface OrchestratorDeps {
  readonly aiPort: AIPort
  readonly stagePort: StagePort
}

/** Events emitted during scene orchestration. */
export type SceneEvent =
  | { readonly type: "action-dispatched"; readonly action: Action }
  | { readonly type: "text-delta"; readonly text: string }
  | { readonly type: "primitive-created"; readonly directive: CreateDirective }
  | { readonly type: "widget-spawned"; readonly directive: SpawnDirective }
  | { readonly type: "suggestions"; readonly suggestions: readonly string[] }
  | { readonly type: "scene-complete"; readonly scene: Scene }
  | { readonly type: "error"; readonly error: string }

/**
 * Orchestrate a single scene: stream AI response and apply to stage.
 *
 * Yields SceneEvent objects as they occur, allowing the UI to react
 * progressively. The final event is always "scene-complete".
 */
export async function* orchestrateScene(
  deps: OrchestratorDeps,
  messages: readonly AIMessage[],
  context: StageContext,
): AsyncIterable<SceneEvent> {
  const accumulated: {
    actions: Action[]
    spawn: SpawnDirective[]
    create: CreateDirective[]
    text: string
    suggestions: string[]
  } = { actions: [], spawn: [], create: [], text: "", suggestions: [] }

  // Track what we've already dispatched to avoid double-execution
  let actionsDispatched = 0
  let primitivesRendered = 0
  let widgetsSpawned = 0

  try {
    for await (const partial of deps.aiPort.stream(messages, context)) {
      // Actions: dispatch new ones immediately
      if (partial.actions) {
        for (let i = actionsDispatched; i < partial.actions.length; i++) {
          const action = partial.actions[i]!
          accumulated.actions.push(action)
          try {
            deps.stagePort.dispatch(action)
          } catch {
            yield { type: "error", error: `Failed to dispatch action to "${action.target}"` }
          }
          yield { type: "action-dispatched", action }
        }
        actionsDispatched = partial.actions.length
      }

      // Text: yield the full accumulated text (consumer diffs if needed)
      if (partial.text !== undefined && partial.text !== accumulated.text) {
        accumulated.text = partial.text
        yield { type: "text-delta", text: partial.text }
      }

      // Create: render new primitives
      if (partial.create) {
        for (let i = primitivesRendered; i < partial.create.length; i++) {
          const directive = partial.create[i]!
          accumulated.create.push(directive)
          deps.stagePort.renderPrimitive(directive)
          yield { type: "primitive-created", directive }
        }
        primitivesRendered = partial.create.length
      }

      // Spawn: mount new widgets
      if (partial.spawn) {
        for (let i = widgetsSpawned; i < partial.spawn.length; i++) {
          const directive = partial.spawn[i]!
          accumulated.spawn.push(directive)
          deps.stagePort.mountWidget(directive)
          yield { type: "widget-spawned", directive }
        }
        widgetsSpawned = partial.spawn.length
      }

      // Suggestions: yield when they arrive
      if (partial.suggestions && partial.suggestions.length > accumulated.suggestions.length) {
        accumulated.suggestions = [...partial.suggestions]
        yield { type: "suggestions", suggestions: accumulated.suggestions }
      }
    }

    // Final: create the validated scene
    const scene = createScene(accumulated)
    yield { type: "scene-complete", scene }
  } catch (err) {
    yield {
      type: "error",
      error: err instanceof Error ? err.message : "Unknown orchestration error",
    }
  }
}
