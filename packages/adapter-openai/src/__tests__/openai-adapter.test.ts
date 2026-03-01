import { describe, it, expect, vi } from "vitest"
import { OpenAIAdapter } from "../index"
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
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          async *[Symbol.asyncIterator]() {
            for (const content of chunks) {
              yield {
                choices: [{ delta: { content } }],
              }
            }
          },
        }),
      },
    },
  }
}

describe("OpenAIAdapter", () => {
  it("yields partial text progressively", async () => {
    const client = createMockClient([
      '{"text": "Hello ',
      'world"}',
    ])

    const adapter = new OpenAIAdapter({
      client: client as never,
      model: "gpt-4o",
    })

    const partials = []
    for await (const partial of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      partials.push(partial)
    }

    expect(partials.length).toBeGreaterThanOrEqual(1)
    const lastPartial = partials[partials.length - 1]
    expect(lastPartial?.text).toBe("Hello world")
  })

  it("parses full scene with all fields", async () => {
    const fullJSON = JSON.stringify({
      actions: [{ target: "chart", do: "highlight", args: { color: "red" } }],
      spawn: [{ widget: "dayun", data: { score: 80 } }],
      create: [{ type: "arrow", from: "A", to: "B" }],
      text: "Analysis complete.",
      suggestions: ["Tell me more"],
    })

    const client = createMockClient([fullJSON])
    const adapter = new OpenAIAdapter({ client: client as never })

    const partials = []
    for await (const partial of adapter.stream(
      [{ role: "user", content: "Analyze" }],
      makeContext(),
    )) {
      partials.push(partial)
    }

    const final = partials[partials.length - 1]!
    expect(final.actions).toHaveLength(1)
    expect(final.spawn).toHaveLength(1)
    expect(final.create).toHaveLength(1)
    expect(final.text).toBe("Analysis complete.")
    expect(final.suggestions).toEqual(["Tell me more"])
  })

  it("uses json_schema response format", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new OpenAIAdapter({ client: client as never })

    for await (const _ of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      // consume
    }

    const call = client.chat.completions.create.mock.calls[0][0]
    expect(call.response_format.type).toBe("json_schema")
    expect(call.response_format.json_schema.name).toBe("wand_scene")
    expect(call.stream).toBe(true)
  })

  it("includes system message with stage context", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new OpenAIAdapter({ client: client as never })

    for await (const _ of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      // consume
    }

    const call = client.chat.completions.create.mock.calls[0][0]
    const systemMsg = call.messages.find((m: { role: string }) => m.role === "system")
    expect(systemMsg).toBeDefined()
    expect(systemMsg.content).toContain("chart")
    expect(systemMsg.content).toContain("dayun")
    expect(systemMsg.content).toContain("You are a test assistant.")
  })

  it("filters system messages from user input", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new OpenAIAdapter({ client: client as never })

    for await (const _ of adapter.stream(
      [
        { role: "system", content: "custom system" },
        { role: "user", content: "Hi" },
      ],
      makeContext(),
    )) {
      // consume
    }

    const call = client.chat.completions.create.mock.calls[0][0]
    // Should have exactly one system message (the built-in one) and one user message
    const systemMsgs = call.messages.filter((m: { role: string }) => m.role === "system")
    expect(systemMsgs).toHaveLength(1) // built-in system prompt
    const userMsgs = call.messages.filter((m: { role: string }) => m.role === "user")
    expect(userMsgs).toHaveLength(1)
  })

  it("uses default model when none specified", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new OpenAIAdapter({ client: client as never })

    for await (const _ of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      // consume
    }

    const call = client.chat.completions.create.mock.calls[0][0]
    expect(call.model).toBe("gpt-4o")
  })

  it("uses custom model when specified", async () => {
    const client = createMockClient(['{"text": "ok"}'])
    const adapter = new OpenAIAdapter({
      client: client as never,
      model: "gpt-4-turbo",
    })

    for await (const _ of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      // consume
    }

    const call = client.chat.completions.create.mock.calls[0][0]
    expect(call.model).toBe("gpt-4-turbo")
  })

  it("falls back to text when JSON parse fails", async () => {
    const client = createMockClient(["not valid json at all"])
    const adapter = new OpenAIAdapter({ client: client as never })

    const partials = []
    for await (const partial of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      partials.push(partial)
    }

    // Should yield the raw text as fallback
    const lastPartial = partials[partials.length - 1]
    expect(lastPartial?.text).toBe("not valid json at all")
  })

  it("handles empty chunks gracefully", async () => {
    const client = createMockClient(['', '{"text":', ' "ok"}', ''])
    const adapter = new OpenAIAdapter({ client: client as never })

    const partials = []
    for await (const partial of adapter.stream(
      [{ role: "user", content: "Hi" }],
      makeContext(),
    )) {
      partials.push(partial)
    }

    const final = partials[partials.length - 1]
    expect(final?.text).toBe("ok")
  })
})
