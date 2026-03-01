import { describe, it, expect } from "vitest"
import { createScene } from "../domain/scene"

describe("createScene", () => {
  it("creates scene from minimal valid input", () => {
    const scene = createScene({})
    expect(scene.actions).toEqual([])
    expect(scene.spawn).toEqual([])
    expect(scene.create).toEqual([])
    expect(scene.text).toBeUndefined()
    expect(scene.suggestions).toEqual([])
  })

  it("parses text field", () => {
    const scene = createScene({ text: "Hello world" })
    expect(scene.text).toBe("Hello world")
  })

  it("ignores non-string text", () => {
    const scene = createScene({ text: 42 })
    expect(scene.text).toBeUndefined()
  })

  it("parses actions with target and do", () => {
    const scene = createScene({
      actions: [{ target: "chart", do: "highlight", args: { color: "red" } }],
    })
    expect(scene.actions).toHaveLength(1)
    expect(scene.actions[0]).toEqual({
      target: "chart",
      do: "highlight",
      args: { color: "red" },
    })
  })

  it("parses actions without args", () => {
    const scene = createScene({
      actions: [{ target: "chart", do: "reset" }],
    })
    expect(scene.actions[0]).toEqual({ target: "chart", do: "reset" })
    expect(scene.actions[0].args).toBeUndefined()
  })

  it("parses spawn directives", () => {
    const scene = createScene({
      spawn: [{ widget: "dayun", data: { score: 85 } }],
    })
    expect(scene.spawn).toHaveLength(1)
    expect(scene.spawn[0]).toEqual({ widget: "dayun", data: { score: 85 } })
  })

  it("parses spawn with optional id", () => {
    const scene = createScene({
      spawn: [{ widget: "dayun", data: {}, id: "dayun-1" }],
    })
    expect(scene.spawn[0].id).toBe("dayun-1")
  })

  it("parses create directives", () => {
    const scene = createScene({
      create: [{ type: "arrow", from: "A", to: "B" }],
    })
    expect(scene.create).toHaveLength(1)
    expect(scene.create[0].type).toBe("arrow")
  })

  it("parses suggestions", () => {
    const scene = createScene({
      suggestions: ["Tell me more", "Show chart"],
    })
    expect(scene.suggestions).toEqual(["Tell me more", "Show chart"])
  })

  it("filters non-string suggestions", () => {
    const scene = createScene({
      suggestions: ["valid", 42, null, "also valid"],
    })
    expect(scene.suggestions).toEqual(["valid", "also valid"])
  })

  it("freezes the returned scene", () => {
    const scene = createScene({ text: "test" })
    expect(Object.isFrozen(scene)).toBe(true)
  })

  // -- Error cases --

  it("throws on null input", () => {
    expect(() => createScene(null)).toThrow("Scene must be a non-null object")
  })

  it("throws on undefined input", () => {
    expect(() => createScene(undefined)).toThrow("Scene must be a non-null object")
  })

  it("throws on primitive input", () => {
    expect(() => createScene("string")).toThrow("Scene must be a non-null object")
  })

  it("throws when actions is not an array", () => {
    expect(() => createScene({ actions: "bad" })).toThrow("actions must be an array")
  })

  it("throws when action missing target", () => {
    expect(() => createScene({ actions: [{ do: "reset" }] })).toThrow(
      "actions[0].target must be a string"
    )
  })

  it("throws when action missing do", () => {
    expect(() => createScene({ actions: [{ target: "chart" }] })).toThrow(
      "actions[0].do must be a string"
    )
  })

  it("throws when spawn is not an array", () => {
    expect(() => createScene({ spawn: {} })).toThrow("spawn must be an array")
  })

  it("throws when spawn item missing widget", () => {
    expect(() => createScene({ spawn: [{ data: {} }] })).toThrow(
      "spawn[0].widget must be a string"
    )
  })

  it("throws when spawn item missing data", () => {
    expect(() => createScene({ spawn: [{ widget: "foo" }] })).toThrow(
      "spawn[0].data must be an object"
    )
  })

  it("throws when create is not an array", () => {
    expect(() => createScene({ create: "bad" })).toThrow("create must be an array")
  })

  it("throws when create item missing type", () => {
    expect(() => createScene({ create: [{ label: "no type" }] })).toThrow(
      "create[0].type must be a string"
    )
  })

  // -- Full scene --

  it("parses a complete scene with all fields", () => {
    const scene = createScene({
      text: "Analysis complete",
      actions: [
        { target: "bazi", do: "highlight", args: { positions: ["日干"] } },
      ],
      spawn: [{ widget: "dayun", data: { score: 80 } }],
      create: [{ type: "bar", label: "金", value: 25 }],
      suggestions: ["More detail?"],
    })

    expect(scene.text).toBe("Analysis complete")
    expect(scene.actions).toHaveLength(1)
    expect(scene.spawn).toHaveLength(1)
    expect(scene.create).toHaveLength(1)
    expect(scene.suggestions).toEqual(["More detail?"])
  })
})
