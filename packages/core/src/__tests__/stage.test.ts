import { describe, it, expect, vi } from "vitest"
import {
  createEmptyStage,
  registerActor,
  unregisterActor,
  applyActions,
  addSpawnedWidget,
} from "../domain/stage"
import type { Actor } from "../domain/stage"

function makeActor(id: string, actionNames: string[] = [], description?: string): Actor {
  const actions = new Map(
    actionNames.map((name) => [name, vi.fn()])
  )
  return { id, actions, description }
}

describe("createEmptyStage", () => {
  it("creates a stage with empty maps", () => {
    const stage = createEmptyStage()
    expect(stage.actors.size).toBe(0)
    expect(stage.spawnedWidgets.size).toBe(0)
  })
})

describe("registerActor", () => {
  it("adds an actor to the stage", () => {
    const stage = createEmptyStage()
    const actor = makeActor("chart", ["highlight", "reset"])
    const next = registerActor(stage, actor)

    expect(next.actors.size).toBe(1)
    expect(next.actors.get("chart")).toBe(actor)
  })

  it("does not mutate original stage", () => {
    const stage = createEmptyStage()
    registerActor(stage, makeActor("chart"))
    expect(stage.actors.size).toBe(0)
  })

  it("overwrites actor with same id", () => {
    let stage = createEmptyStage()
    stage = registerActor(stage, makeActor("chart", ["old"]))
    const newActor = makeActor("chart", ["new"])
    stage = registerActor(stage, newActor)

    expect(stage.actors.size).toBe(1)
    expect(stage.actors.get("chart")!.actions.has("new")).toBe(true)
    expect(stage.actors.get("chart")!.actions.has("old")).toBe(false)
  })

  it("preserves other actors", () => {
    let stage = createEmptyStage()
    stage = registerActor(stage, makeActor("a"))
    stage = registerActor(stage, makeActor("b"))

    expect(stage.actors.size).toBe(2)
    expect(stage.actors.has("a")).toBe(true)
    expect(stage.actors.has("b")).toBe(true)
  })
})

describe("unregisterActor", () => {
  it("removes an actor from the stage", () => {
    let stage = createEmptyStage()
    stage = registerActor(stage, makeActor("chart"))
    const next = unregisterActor(stage, "chart")

    expect(next.actors.size).toBe(0)
  })

  it("no-ops for unknown id", () => {
    const stage = createEmptyStage()
    const next = unregisterActor(stage, "missing")
    expect(next.actors.size).toBe(0)
  })

  it("does not mutate original stage", () => {
    let stage = createEmptyStage()
    stage = registerActor(stage, makeActor("chart"))
    unregisterActor(stage, "chart")
    expect(stage.actors.size).toBe(1)
  })
})

describe("applyActions", () => {
  it("dispatches action to correct handler", () => {
    const handler = vi.fn()
    const actor: Actor = {
      id: "chart",
      actions: new Map([["highlight", handler]]),
    }
    let stage = createEmptyStage()
    stage = registerActor(stage, actor)

    const errors = applyActions(stage, [
      { target: "chart", do: "highlight", args: { color: "red" } },
    ])

    expect(errors).toHaveLength(0)
    expect(handler).toHaveBeenCalledWith({ color: "red" })
  })

  it("passes empty object when action has no args", () => {
    const handler = vi.fn()
    const actor: Actor = {
      id: "chart",
      actions: new Map([["reset", handler]]),
    }
    let stage = createEmptyStage()
    stage = registerActor(stage, actor)

    applyActions(stage, [{ target: "chart", do: "reset" }])
    expect(handler).toHaveBeenCalledWith({})
  })

  it("returns error for missing actor", () => {
    const stage = createEmptyStage()
    const errors = applyActions(stage, [
      { target: "missing", do: "highlight" },
    ])

    expect(errors).toHaveLength(1)
    expect(errors[0].type).toBe("actor-not-found")
    expect(errors[0].message).toContain("missing")
  })

  it("returns error for missing action on existing actor", () => {
    const actor = makeActor("chart", ["highlight"])
    let stage = createEmptyStage()
    stage = registerActor(stage, actor)

    const errors = applyActions(stage, [
      { target: "chart", do: "nonexistent" },
    ])

    expect(errors).toHaveLength(1)
    expect(errors[0].type).toBe("action-not-found")
    expect(errors[0].message).toContain("nonexistent")
  })

  it("dispatches multiple actions in order", () => {
    const calls: string[] = []
    const actor: Actor = {
      id: "chart",
      actions: new Map([
        ["highlight", () => calls.push("highlight")],
        ["connect", () => calls.push("connect")],
      ]),
    }
    let stage = createEmptyStage()
    stage = registerActor(stage, actor)

    applyActions(stage, [
      { target: "chart", do: "highlight" },
      { target: "chart", do: "connect" },
    ])

    expect(calls).toEqual(["highlight", "connect"])
  })

  it("continues after errors and collects all", () => {
    const handler = vi.fn()
    const actor: Actor = {
      id: "chart",
      actions: new Map([["highlight", handler]]),
    }
    let stage = createEmptyStage()
    stage = registerActor(stage, actor)

    const errors = applyActions(stage, [
      { target: "missing", do: "foo" },
      { target: "chart", do: "highlight" },
      { target: "chart", do: "missing-action" },
    ])

    expect(errors).toHaveLength(2)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe("addSpawnedWidget", () => {
  it("adds a widget with explicit id", () => {
    const stage = createEmptyStage()
    const next = addSpawnedWidget(stage, {
      widget: "dayun",
      data: { score: 85 },
      id: "dayun-1",
    })

    expect(next.spawnedWidgets.size).toBe(1)
    const widget = next.spawnedWidgets.get("dayun-1")!
    expect(widget.widget).toBe("dayun")
    expect(widget.data).toEqual({ score: 85 })
  })

  it("generates id when not provided", () => {
    const stage = createEmptyStage()
    const next = addSpawnedWidget(stage, {
      widget: "dayun",
      data: {},
    })

    expect(next.spawnedWidgets.size).toBe(1)
    const [id] = [...next.spawnedWidgets.keys()]
    expect(id).toMatch(/^spawn-/)
  })

  it("does not mutate original stage", () => {
    const stage = createEmptyStage()
    addSpawnedWidget(stage, { widget: "dayun", data: {}, id: "x" })
    expect(stage.spawnedWidgets.size).toBe(0)
  })
})
