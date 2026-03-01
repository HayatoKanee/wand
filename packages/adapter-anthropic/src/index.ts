/**
 * @anthropic-ai/wand-adapter-anthropic
 *
 * Wand adapter for Anthropic Claude.
 * Implements AIPort by streaming WandScene JSON via Claude's Messages API.
 */

import type { AIPort, AIMessage, StageContext, Scene } from "@anthropic-ai/wand-core"
import { formatStageContext } from "@anthropic-ai/wand-core"
import type Anthropic from "@anthropic-ai/sdk"

export interface AnthropicAdapterOptions {
  client: Anthropic
  model?: string
}

export class AnthropicAdapter implements AIPort {
  private client: Anthropic
  private model: string

  constructor(options: AnthropicAdapterOptions) {
    this.client = options.client
    this.model = options.model ?? "claude-sonnet-4-20250514"
  }

  async *stream(
    messages: readonly AIMessage[],
    context: StageContext,
  ): AsyncIterable<Partial<Scene>> {
    const systemPrompt = buildAnthropicSystemPrompt(context)

    const response = this.client.messages.stream({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    })

    let accumulated = ""

    for await (const event of response) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        accumulated += event.delta.text

        // Try parsing the accumulated JSON
        const parsed = tryParsePartialScene(accumulated)
        if (parsed) {
          yield parsed
        }
      }
    }

    // Final parse
    const final = tryParseJSON(accumulated)
    if (final) {
      yield final as Partial<Scene>
    }
  }
}

function buildAnthropicSystemPrompt(context: StageContext): string {
  const stageContext = formatStageContext(context)

  return `${context.systemPrompt}

You control a visual UI through structured JSON. Your response must be a valid JSON object with this schema:

{
  "actions": [{"target": "actor-id", "do": "action-name", "args": {...}}],
  "spawn": [{"widget": "widget-name", "data": {...}}],
  "create": [{"type": "primitive-type", ...props}],
  "text": "Your narration text here",
  "suggestions": ["Follow-up 1", "Follow-up 2"]
}

All fields are optional. Use "actions" to control existing components, "spawn" to show widgets, "create" to draw visuals, "text" for explanation.

Current stage state:
${stageContext}

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no code fences.`
}

function tryParsePartialScene(raw: string): Partial<Scene> | null {
  // Try to extract text field progressively
  const textMatch = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)/)
  if (textMatch) {
    return { text: unescapeJSON(textMatch[1]!) }
  }
  return null
}

function tryParseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    // Try to find JSON within the response (in case of markdown wrapping)
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

function unescapeJSON(str: string): string {
  return str.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\")
}
