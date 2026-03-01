/**
 * AIPort — the port through which Wand communicates with AI providers.
 *
 * Each provider adapter (Anthropic, OpenAI, etc.) implements this interface.
 * The core orchestrator depends only on this abstraction, never on a specific SDK.
 */

import type { Scene } from "../domain/scene"

/** A message in the conversation history. */
export interface AIMessage {
  readonly role: "user" | "assistant" | "system"
  readonly content: string
}

/** Summary of an actor currently on stage, sent to the AI for context. */
export interface ActorSummary {
  readonly id: string
  readonly actions: readonly string[]
  readonly description?: string
}

/** Summary of a registered spawnable widget, sent to the AI for context. */
export interface WidgetSummary {
  readonly name: string
  readonly description: string
}

/** Context about the current stage state, passed to the AI provider. */
export interface StageContext {
  readonly actors: readonly ActorSummary[]
  readonly widgets: readonly WidgetSummary[]
  readonly primitives: readonly string[]
  readonly systemPrompt: string
}

/**
 * The AI port interface.
 *
 * Implementations must yield partial Scene objects as they stream from the LLM.
 * Each yielded partial may contain any subset of Scene fields.
 * The orchestrator merges partials progressively.
 */
export interface AIPort {
  stream(
    messages: readonly AIMessage[],
    context: StageContext,
  ): AsyncIterable<Partial<Scene>>
}
