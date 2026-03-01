import { describe, it, expect, vi } from "vitest"
import { orchestrateScene } from "../application/orchestrator"
import type { OrchestratorDeps, SceneEvent } from "../application/orchestrator"
import type { AIPort, StageContext } from "../ports/ai-port"
import type { StagePort } from "../ports/stage-port"
import type { Scene } from "../domain/scene"

function makeStagePort(): StagePort {
  return {
    getActors: () => new Map(),
    dispatch: vi.fn(),
    mountWidget: vi.fn(),
    renderPrimitive: vi.fn(),
  }
}

function makeContext(): StageContext {
  return {
    actors: [],
    widgets: [],
    primitives: [],
    systemPrompt: "test",
  }
}

async function collectEvents(
  gen: AsyncIterable<SceneEvent>
): Promise<SceneEvent[]> {
  const events: SceneEvent[] = []
  for await (const e of gen) {
    events.push(e)
  }
  return events
}

describe("orchestrateScene", () => {
  it("yields scene-complete for empty AI response", async () => {
    const aiPort: AIPort = {
      async *stream() {
        yield {}
      },
    }
    const stagePort = makeStagePort()
    const deps: OrchestratorDeps = { aiPort, stagePort }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    const complete = events.find((e) => e.type === "scene-complete")
    expect(complete).toBeDefined()
  })

  it("dispatches actions to stage port immediately", async () => {
    const dispatch = vi.fn()
    const aiPort: AIPort = {
      async *stream() {
        yield {
          actions: [{ target: "chart", do: "highlight", args: { color: "red" } }],
        }
      },
    }
    const stagePort = { ...makeStagePort(), dispatch }
    const deps: OrchestratorDeps = { aiPort, stagePort }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    expect(dispatch).toHaveBeenCalledWith({
      target: "chart",
      do: "highlight",
      args: { color: "red" },
    })
    expect(events.some((e) => e.type === "action-dispatched")).toBe(true)
  })

  it("yields text-delta events", async () => {
    const aiPort: AIPort = {
      async *stream() {
        yield { text: "Hello" }
        yield { text: "Hello world" }
      },
    }
    const deps: OrchestratorDeps = { aiPort, stagePort: makeStagePort() }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    const textEvents = events.filter((e) => e.type === "text-delta")
    expect(textEvents).toHaveLength(2)
    expect((textEvents[0] as { text: string }).text).toBe("Hello")
    expect((textEvents[1] as { text: string }).text).toBe("Hello world")
  })

  it("does not yield duplicate text-delta when text unchanged", async () => {
    const aiPort: AIPort = {
      async *stream() {
        yield { text: "Hello" }
        yield { text: "Hello" } // same text
      },
    }
    const deps: OrchestratorDeps = { aiPort, stagePort: makeStagePort() }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    const textEvents = events.filter((e) => e.type === "text-delta")
    expect(textEvents).toHaveLength(1)
  })

  it("mounts widgets via stage port", async () => {
    const mountWidget = vi.fn()
    const aiPort: AIPort = {
      async *stream() {
        yield {
          spawn: [{ widget: "dayun", data: { score: 80 } }],
        }
      },
    }
    const stagePort = { ...makeStagePort(), mountWidget }
    const deps: OrchestratorDeps = { aiPort, stagePort }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    expect(mountWidget).toHaveBeenCalledWith({
      widget: "dayun",
      data: { score: 80 },
    })
    expect(events.some((e) => e.type === "widget-spawned")).toBe(true)
  })

  it("renders primitives via stage port", async () => {
    const renderPrimitive = vi.fn()
    const aiPort: AIPort = {
      async *stream() {
        yield {
          create: [{ type: "bar", label: "金", value: 25 }],
        }
      },
    }
    const stagePort = { ...makeStagePort(), renderPrimitive }
    const deps: OrchestratorDeps = { aiPort, stagePort }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    expect(renderPrimitive).toHaveBeenCalledWith({
      type: "bar",
      label: "金",
      value: 25,
    })
    expect(events.some((e) => e.type === "primitive-created")).toBe(true)
  })

  it("yields suggestions event", async () => {
    const aiPort: AIPort = {
      async *stream() {
        yield { suggestions: ["Ask more"] }
      },
    }
    const deps: OrchestratorDeps = { aiPort, stagePort: makeStagePort() }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    const sugEvent = events.find((e) => e.type === "suggestions") as {
      type: "suggestions"
      suggestions: string[]
    }
    expect(sugEvent).toBeDefined()
    expect(sugEvent.suggestions).toEqual(["Ask more"])
  })

  it("does not dispatch same action twice on progressive updates", async () => {
    const dispatch = vi.fn()
    const aiPort: AIPort = {
      async *stream() {
        yield {
          actions: [{ target: "a", do: "one" }],
        }
        yield {
          actions: [
            { target: "a", do: "one" },
            { target: "b", do: "two" },
          ],
        }
      },
    }
    const stagePort = { ...makeStagePort(), dispatch }
    const deps: OrchestratorDeps = { aiPort, stagePort }

    await collectEvents(orchestrateScene(deps, [], makeContext()))

    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenNthCalledWith(1, { target: "a", do: "one" })
    expect(dispatch).toHaveBeenNthCalledWith(2, { target: "b", do: "two" })
  })

  it("yields error event when action dispatch throws", async () => {
    const aiPort: AIPort = {
      async *stream() {
        yield { actions: [{ target: "broken", do: "crash" }] }
      },
    }
    const stagePort = {
      ...makeStagePort(),
      dispatch: () => {
        throw new Error("boom")
      },
    }
    const deps: OrchestratorDeps = { aiPort, stagePort }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    expect(events.some((e) => e.type === "error")).toBe(true)
  })

  it("yields error event when AI stream throws", async () => {
    const aiPort: AIPort = {
      async *stream() {
        throw new Error("API failure")
      },
    }
    const deps: OrchestratorDeps = { aiPort, stagePort: makeStagePort() }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    const errEvent = events.find((e) => e.type === "error") as {
      type: "error"
      error: string
    }
    expect(errEvent).toBeDefined()
    expect(errEvent.error).toBe("API failure")
  })

  it("handles full scene with all event types", async () => {
    const aiPort: AIPort = {
      async *stream() {
        yield {
          text: "Analyzing...",
          actions: [{ target: "chart", do: "highlight" }],
        }
        yield {
          text: "Analyzing your chart...",
          actions: [{ target: "chart", do: "highlight" }],
          spawn: [{ widget: "dayun", data: { score: 80 } }],
          create: [{ type: "bar", label: "木", value: 15 }],
          suggestions: ["Tell me more"],
        }
      },
    }
    const deps: OrchestratorDeps = { aiPort, stagePort: makeStagePort() }

    const events = await collectEvents(
      orchestrateScene(deps, [], makeContext())
    )

    const types = events.map((e) => e.type)
    expect(types).toContain("action-dispatched")
    expect(types).toContain("text-delta")
    expect(types).toContain("widget-spawned")
    expect(types).toContain("primitive-created")
    expect(types).toContain("suggestions")
    expect(types).toContain("scene-complete")
  })
})
