import { describe, it, expect, vi } from "vitest"
import { createWandStore } from "../store"

describe("WandStore", () => {
  // -- Actor registration --

  describe("register / unregister", () => {
    it("registers an actor with actions", () => {
      const store = createWandStore()
      store.getState().register("chart", { highlight: vi.fn(), reset: vi.fn() }, "BaZi chart")

      const actors = store.getState().actors
      expect(actors.size).toBe(1)
      expect(actors.get("chart")!.id).toBe("chart")
      expect(actors.get("chart")!.actionNames).toEqual(["highlight", "reset"])
      expect(actors.get("chart")!.description).toBe("BaZi chart")
    })

    it("unregisters an actor", () => {
      const store = createWandStore()
      store.getState().register("chart", { reset: vi.fn() })
      store.getState().unregister("chart")

      expect(store.getState().actors.size).toBe(0)
    })

    it("overwrites actor on duplicate id", () => {
      const store = createWandStore()
      store.getState().register("chart", { old: vi.fn() })
      store.getState().register("chart", { new_action: vi.fn() })

      expect(store.getState().actors.size).toBe(1)
      expect(store.getState().actors.get("chart")!.actionNames).toEqual(["new_action"])
    })
  })

  // -- Dispatch --

  describe("dispatch", () => {
    it("calls handler on the target actor", () => {
      const handler = vi.fn()
      const store = createWandStore()
      store.getState().register("chart", { highlight: handler })

      store.getState().dispatch({ target: "chart", do: "highlight", args: { color: "red" } })
      expect(handler).toHaveBeenCalledWith({ color: "red" })
    })

    it("no-ops for missing actor", () => {
      const store = createWandStore()
      // Should not throw
      store.getState().dispatch({ target: "missing", do: "highlight" })
    })

    it("no-ops for missing action", () => {
      const store = createWandStore()
      store.getState().register("chart", { highlight: vi.fn() })
      // Should not throw
      store.getState().dispatch({ target: "chart", do: "nonexistent" })
    })
  })

  // -- Feed mutations --

  describe("startScene", () => {
    it("creates a new scene entry", () => {
      const store = createWandStore()
      const id = store.getState().startScene()

      expect(id).toMatch(/^scene-/)
      expect(store.getState().scenes).toHaveLength(1)
      expect(store.getState().scenes[0].id).toBe(id)
      expect(store.getState().scenes[0].items).toEqual([])
      expect(store.getState().scenes[0].suggestions).toEqual([])
      expect(store.getState().scenes[0].complete).toBe(false)
    })

    it("sets isStreaming to true", () => {
      const store = createWandStore()
      store.getState().startScene()
      expect(store.getState().isStreaming).toBe(true)
    })

    it("sets currentSceneId", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      expect(store.getState().currentSceneId).toBe(id)
    })
  })

  describe("appendText", () => {
    it("adds a text item to the scene", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().appendText(id, "Hello")

      expect(store.getState().scenes[0].items).toHaveLength(1)
      expect(store.getState().scenes[0].items[0]).toEqual({ type: "text", content: "Hello" })
    })

    it("replaces last text item (streaming behavior)", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().appendText(id, "Hel")
      store.getState().appendText(id, "Hello world")

      expect(store.getState().scenes[0].items).toHaveLength(1)
      expect(store.getState().scenes[0].items[0]).toEqual({ type: "text", content: "Hello world" })
    })

    it("creates new text segment after widget (interleaving)", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().appendText(id, "Before widget")
      store.getState().addWidget(id, { widget: "bazi", data: {} })
      store.getState().appendText(id, "After widget")

      const items = store.getState().scenes[0].items
      expect(items).toHaveLength(3)
      expect(items[0]).toEqual({ type: "text", content: "Before widget" })
      expect(items[1]).toEqual({ type: "widget", directive: { widget: "bazi", data: {} } })
      expect(items[2]).toEqual({ type: "text", content: "After widget" })
    })

    it("replaces trailing text after widget during streaming", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().appendText(id, "Intro")
      store.getState().addWidget(id, { widget: "bazi", data: {} })
      store.getState().appendText(id, "Part")
      store.getState().appendText(id, "Partial text")

      const items = store.getState().scenes[0].items
      expect(items).toHaveLength(3)
      expect(items[2]).toEqual({ type: "text", content: "Partial text" })
    })
  })

  describe("addWidget", () => {
    it("adds a widget item to the scene", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().addWidget(id, { widget: "dayun", data: { score: 80 } })

      expect(store.getState().scenes[0].items).toHaveLength(1)
      expect(store.getState().scenes[0].items[0]).toEqual({
        type: "widget",
        directive: { widget: "dayun", data: { score: 80 } },
      })
    })
  })

  describe("addPrimitive", () => {
    it("adds a primitive item to the scene", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().addPrimitive(id, { type: "bar", label: "金", value: 25 })

      expect(store.getState().scenes[0].items).toHaveLength(1)
      expect(store.getState().scenes[0].items[0]).toEqual({
        type: "primitive",
        directive: { type: "bar", label: "金", value: 25 },
      })
    })
  })

  describe("setSuggestions", () => {
    it("sets suggestions on a scene", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().setSuggestions(id, ["Tell me more", "Show chart"])

      expect(store.getState().scenes[0].suggestions).toEqual(["Tell me more", "Show chart"])
    })
  })

  describe("completeScene", () => {
    it("marks scene as complete", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().completeScene(id)

      expect(store.getState().scenes[0].complete).toBe(true)
    })

    it("sets isStreaming to false", () => {
      const store = createWandStore()
      const id = store.getState().startScene()
      store.getState().completeScene(id)

      expect(store.getState().isStreaming).toBe(false)
    })
  })

  // -- Widget registration --

  describe("registerWidget", () => {
    it("registers a widget component", () => {
      const store = createWandStore()
      const FakeComponent = () => null
      store.getState().registerWidget({
        name: "dayun",
        description: "大运K线",
        component: FakeComponent as any,
      })

      expect(store.getState().widgets.size).toBe(1)
      expect(store.getState().widgets.get("dayun")!.name).toBe("dayun")
      expect(store.getState().widgets.get("dayun")!.component).toBe(FakeComponent)
    })
  })

  // -- Stage context --

  describe("getActorSummaries", () => {
    it("returns summaries of all actors", () => {
      const store = createWandStore()
      store.getState().register("chart", { highlight: vi.fn(), reset: vi.fn() }, "BaZi chart")
      store.getState().register("wuxing", { highlight: vi.fn() }, "五行图")

      const summaries = store.getState().getActorSummaries()
      expect(summaries).toHaveLength(2)
      expect(summaries.find((s) => s.id === "chart")).toEqual({
        id: "chart",
        actions: ["highlight", "reset"],
        description: "BaZi chart",
      })
    })
  })

  describe("getWidgetSummaries", () => {
    it("returns summaries of all widgets", () => {
      const store = createWandStore()
      store.getState().registerWidget({
        name: "dayun",
        description: "大运K线",
        component: (() => null) as any,
      })

      const summaries = store.getState().getWidgetSummaries()
      expect(summaries).toEqual([{ name: "dayun", description: "大运K线" }])
    })
  })

  // -- Full lifecycle --

  describe("full scene lifecycle", () => {
    it("start → text → widget → suggestions → complete", () => {
      const store = createWandStore()

      const sceneId = store.getState().startScene()
      expect(store.getState().isStreaming).toBe(true)

      store.getState().appendText(sceneId, "Analyzing...")
      store.getState().appendText(sceneId, "Analyzing your chart...")
      store.getState().addWidget(sceneId, { widget: "dayun", data: { score: 80 } })
      store.getState().setSuggestions(sceneId, ["More?"])
      store.getState().completeScene(sceneId)

      const scene = store.getState().scenes[0]
      expect(scene.complete).toBe(true)
      expect(scene.items).toHaveLength(2) // 1 text (streaming replaced) + 1 widget
      expect(scene.items[0]).toEqual({ type: "text", content: "Analyzing your chart..." })
      expect(scene.items[1]).toEqual({
        type: "widget",
        directive: { widget: "dayun", data: { score: 80 } },
      })
      expect(scene.suggestions).toEqual(["More?"])
      expect(store.getState().isStreaming).toBe(false)
    })
  })
})
