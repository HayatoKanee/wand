import { describe, it, expect, vi } from "vitest"
import { AnthropicAdapter } from "../index"
import type { StageContext } from "@anthropic-ai/wand-core"

function makeContext(): StageContext {
  return {
    actors: [{ id: "chart", actions: ["highlight", "dim"] }],
    widgets: [{ name: "dayun", description: "大运走势图" }],
    primitives: ["arrow", "flow", "badge"],
    systemPrompt: "You are a test assistant.",
  }
}

function createMockClient(chunks: string[]) {
  return {
    messages: {
      stream: vi.fn().mockReturnValue({
        async *[Symbol.asyncIterator]() {
          for (const text of chunks) {
            yield {
              type: "content_block_delta" as const,
              delta: { type: "text_delta" as const, text },
            }
          }
        },
      }),
    },
  }
}

describe("AnthropicAdapter", () => {
  it("yields partial text progressively from streamed chunks", async () => {
    const client = createMockClient([
      '{"text": "Hello ',
      'world"}',
    ])

    const adapter = new AnthropicAdapter({
      client: client as never,
      model: "claude-sonnet-4-20250514",
    })

    const partials = []
    for await (const partial of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      partials.push(partial)
    }

    // Should have at least one partial with text and a final parse
    expect(partials.length).toBeGreaterThanOrEqual(1)
    const lastPartial = partials[partials.length - 1]
    expect(lastPartial?.text).toBe("Hello world")
  })

  it("parses full scene with actions, spawn, create", async () => {
    const fullJSON = JSON.stringify({
      actions: [{ target: "chart", do: "highlight", args: { color: "red" } }],
      spawn: [{ widget: "dayun", data: { score: 80 } }],
      create: [{ type: "arrow", from: "A", to: "B" }],
      text: "Analysis complete.",
      suggestions: ["Tell me more"],
    })

    const client = createMockClient([fullJSON])
    const adapter = new AnthropicAdapter({ client: client as never })

    const partials = []
    for await (const partial of adapter.stream(
      [{ role: "user", content: "Analyze" }],
      makeContext(),
    )) {
      partials.push(partial)
    }

    const final = partials[partials.length - 1]!
    expect(final.actions).toHaveLength(1)
    expect(final.actions![0].target).toBe("chart")
    expect(final.spawn).toHaveLength(1)
    expect(final.spawn![0].widget).toBe("dayun")
    expect(final.create).toHaveLength(1)
    expect(final.text).toBe("Analysis complete.")
    expect(final.suggestions).toEqual(["Tell me more"])
  })

  it("handles JSON wrapped in markdown code fences", async () => {
    const wrapped = '```json\n{"text": "wrapped"}\n```'
    const client = createMockClient([wrapped])
    const adapter = new AnthropicAdapter({ client: client as never })

    const partials = []
    for await (const partial of adapter.stream(
      [{ role: "user", content: "test" }],
      makeContext(),
    )) {
      partials.push(partial)
    }

    const final = partials[partials.length - 1]
    expect(final?.text).toBe("wrapped")
  })

  it("passes system messages as system param, not in messages", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new AnthropicAdapter({ client: client as never })

    const partials = []
    for await (const _partial of adapter.stream(
      [
        { role: "system", content: "Be helpful" },
        { role: "user", content: "Hi" },
      ],
      makeContext(),
    )) {
      partials.push(_partial)
    }

    // Verify system messages are filtered from the messages array
    const call = client.messages.stream.mock.calls[0][0]
    expect(call.messages.every((m: { role: string }) => m.role !== "system")).toBe(true)
    expect(call.system).toBeDefined()
  })

  it("uses default model when none specified", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new AnthropicAdapter({ client: client as never })

    for await (const _ of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      // consume
    }

    const call = client.messages.stream.mock.calls[0][0]
    expect(call.model).toBe("claude-sonnet-4-20250514")
  })

  it("uses custom model when specified", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new AnthropicAdapter({
      client: client as never,
      model: "claude-opus-4-20250514",
    })

    for await (const _ of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      // consume
    }

    const call = client.messages.stream.mock.calls[0][0]
    expect(call.model).toBe("claude-opus-4-20250514")
  })

  it("includes stage context in system prompt", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new AnthropicAdapter({ client: client as never })

    for await (const _ of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      // consume
    }

    const call = client.messages.stream.mock.calls[0][0]
    expect(call.system).toContain("chart")
    expect(call.system).toContain("highlight")
    expect(call.system).toContain("dayun")
    expect(call.system).toContain("You are a test assistant.")
  })

  it("unescapes newlines and quotes in streamed text", async () => {
    const client = createMockClient(['{"text": "line1\\nline2\\nhe said \\"hello\\""}'])
    const adapter = new AnthropicAdapter({ client: client as never })

    const partials = []
    for await (const partial of adapter.stream(
      [{ role: "user", content: "test" }],
      makeContext(),
    )) {
      partials.push(partial)
    }

    // At least the progressive parse should unescape
    const textPartials = partials.filter((p) => p.text)
    expect(textPartials.length).toBeGreaterThanOrEqual(1)
    const firstText = textPartials[0]!.text!
    expect(firstText).toContain("line1\nline2")
  })
})
