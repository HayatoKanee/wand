/**
 * @anthropic-ai/wand-adapter-openai
 *
 * Wand adapter for OpenAI.
 * Implements AIPort using OpenAI's structured output (json_schema mode)
 * for guaranteed valid WandScene JSON.
 */

import type { AIPort, AIMessage, StageContext, Scene } from "@anthropic-ai/wand-core"
import { formatStageContext } from "@anthropic-ai/wand-core"
import type OpenAI from "openai"

export interface OpenAIAdapterOptions {
  client: OpenAI
  model?: string
}

/** JSON Schema for WandScene — used with OpenAI's structured output. */
const WAND_SCENE_SCHEMA = {
  name: "wand_scene",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      actions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            target: { type: "string" as const },
            do: { type: "string" as const },
            args: { type: "object" as const, additionalProperties: true },
          },
          required: ["target", "do"],
          additionalProperties: false,
        },
      },
      spawn: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            widget: { type: "string" as const },
            data: { type: "object" as const, additionalProperties: true },
            id: { type: "string" as const },
          },
          required: ["widget", "data"],
          additionalProperties: false,
        },
      },
      create: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            type: { type: "string" as const },
          },
          required: ["type"],
          additionalProperties: true,
        },
      },
      text: { type: "string" as const },
      suggestions: {
        type: "array" as const,
        items: { type: "string" as const },
      },
    },
    required: [],
    additionalProperties: false,
  },
}

export class OpenAIAdapter implements AIPort {
  private client: OpenAI
  private model: string

  constructor(options: OpenAIAdapterOptions) {
    this.client = options.client
    this.model = options.model ?? "gpt-4o"
  }

  async *stream(
    messages: readonly AIMessage[],
    context: StageContext,
  ): AsyncIterable<Partial<Scene>> {
    const systemPrompt = buildOpenAISystemPrompt(context)

    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: {
        type: "json_schema",
        json_schema: WAND_SCENE_SCHEMA,
      },
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
      ],
      stream: true,
    })

    let accumulated = ""

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        accumulated += delta

        // Try progressive text extraction
        const textMatch = accumulated.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)/)
        if (textMatch) {
          yield {
            text: textMatch[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"'),
          }
        }
      }
    }

    // Final parse — OpenAI structured output guarantees valid JSON
    try {
      const scene = JSON.parse(accumulated) as Partial<Scene>
      yield scene
    } catch {
      // Should not happen with structured output, but handle gracefully
      yield { text: accumulated }
    }
  }
}

function buildOpenAISystemPrompt(context: StageContext): string {
  const stageContext = formatStageContext(context)

  return `${context.systemPrompt}

You control a visual UI. Respond with a WandScene JSON object.

Fields:
- actions: Control existing components [{target, do, args}]
- spawn: Place widgets [{widget, data}]
- create: Draw primitives [{type, ...props}]
- text: Your narration
- suggestions: Follow-up prompts

${stageContext}`
}
