/**
 * PromptBuilder — builds the stage context for the AI system prompt.
 *
 * Serializes current stage state into a compact text representation
 * that the AI can use to know what is on screen and what actions are available.
 * Token-efficient: ~50 tokens for a typical page.
 */

import type { StagePort } from "../ports/stage-port"
import type { StageContext, WidgetSummary } from "../ports/ai-port"
import { PRIMITIVE_TYPES } from "../domain/primitives"

export interface PromptBuilderOptions {
  readonly systemPrompt: string
  readonly widgets: readonly WidgetSummary[]
}

/**
 * Build the StageContext that gets injected into the AI's system prompt.
 */
export function buildStageContext(
  stagePort: StagePort,
  options: PromptBuilderOptions,
): StageContext {
  const actors = Array.from(stagePort.getActors().entries()).map(
    ([id, { actions }]) => ({ id, actions: [...actions] }),
  )

  return {
    actors,
    widgets: options.widgets,
    primitives: [...PRIMITIVE_TYPES],
    systemPrompt: options.systemPrompt,
  }
}

/**
 * Format stage context as a string for inclusion in system prompts.
 *
 * Produces a compact representation (~50 tokens for a typical page):
 * ```
 * STAGE:
 *   bazi-chart [highlight,dim,connect,reset]
 *   wuxing-bar [highlight,animate]
 * WIDGETS: dayun-chart, spouse-card
 * PRIMITIVES: arrow, flow, compare, box, text, badge, bar, ...
 * ```
 */
export function formatStageContext(context: StageContext): string {
  const lines: string[] = []

  if (context.actors.length > 0) {
    lines.push("STAGE:")
    for (const actor of context.actors) {
      const desc = actor.description ? ` — ${actor.description}` : ""
      lines.push(`  ${actor.id} [${actor.actions.join(",")}]${desc}`)
    }
  }

  if (context.widgets.length > 0) {
    lines.push(
      "WIDGETS: " +
        context.widgets.map((w) => `${w.name} (${w.description})`).join(", "),
    )
  }

  lines.push("PRIMITIVES: " + context.primitives.join(", "))

  return lines.join("\n")
}
