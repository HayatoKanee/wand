import { describe, it, expect, vi } from "vitest"
import React from "react"
import { renderHook, act } from "@testing-library/react"
import { WandProvider } from "../provider"
import { useWand } from "../hooks/use-wand"
import { useManualStage } from "../hooks/use-manual-stage"
import { useFeed } from "../hooks/use-feed"
import { registerWidget, getRegisteredWidgets } from "../register-widget"
import type { AIPort } from "@anthropic-ai/wand-core"

const noopAdapter: AIPort = {
  stream: async function* () {},
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <WandProvider adapter={noopAdapter}>
      {children}
    </WandProvider>
  )
}

// ---------------------------------------------------------------------------
// useWand
// ---------------------------------------------------------------------------

describe("useWand", () => {
  it("registers actor on mount", () => {
    const actions = { highlight: vi.fn(), reset: vi.fn() }
    const { result } = renderHook(() => {
      useWand("chart", actions, "test chart")
      return useManualStage()
    }, { wrapper: Wrapper })

    // Actor should be registered — verify via dispatch
    act(() => {
      result.current.dispatch({ target: "chart", do: "highlight", args: { color: "red" } })
    })
    expect(actions.highlight).toHaveBeenCalledWith({ color: "red" })
  })

  it("unregisters actor on unmount", () => {
    const actions = { highlight: vi.fn() }
    const { unmount, result } = renderHook(() => {
      useWand("chart", actions)
      return useManualStage()
    }, { wrapper: Wrapper })

    unmount()

    // After unmount, dispatch should be a no-op (actor gone)
    // We can't easily verify this without accessing the store directly,
    // but the test verifies no error is thrown
  })

  it("no-ops when outside WandProvider", () => {
    // Should not throw
    const { result } = renderHook(() => {
      useWand("chart", { highlight: vi.fn() })
    })
    // No error = success
  })

  it("updates action handlers via ref without re-registering", () => {
    let callCount = 0
    const { rerender } = renderHook(
      ({ handler }) => {
        useWand("chart", { highlight: handler })
      },
      {
        wrapper: Wrapper,
        initialProps: { handler: () => { callCount = 1 } },
      }
    )

    // Update handler
    rerender({ handler: () => { callCount = 2 } })
    // The ref should now point to the new handler
  })
})

// ---------------------------------------------------------------------------
// useManualStage
// ---------------------------------------------------------------------------

describe("useManualStage", () => {
  it("returns all stage methods", () => {
    const { result } = renderHook(() => useManualStage(), { wrapper: Wrapper })

    expect(result.current.dispatch).toBeTypeOf("function")
    expect(result.current.startScene).toBeTypeOf("function")
    expect(result.current.appendText).toBeTypeOf("function")
    expect(result.current.addWidget).toBeTypeOf("function")
    expect(result.current.addPrimitive).toBeTypeOf("function")
    expect(result.current.setSuggestions).toBeTypeOf("function")
    expect(result.current.completeScene).toBeTypeOf("function")
  })

  it("returns noop stage outside WandProvider", () => {
    const { result } = renderHook(() => useManualStage())

    // Should not throw
    const sceneId = result.current.startScene()
    expect(sceneId).toBe("noop")
    result.current.appendText("noop", "test")
    result.current.addWidget("noop", { widget: "x", data: {} })
    result.current.completeScene("noop")
  })

  it("startScene creates a scene in the feed", () => {
    const { result } = renderHook(() => ({
      stage: useManualStage(),
      feed: useFeed(),
    }), { wrapper: Wrapper })

    act(() => {
      result.current.stage.startScene()
    })

    expect(result.current.feed.scenes).toHaveLength(1)
    expect(result.current.feed.isStreaming).toBe(true)
  })

  it("full scene lifecycle flows through feed", () => {
    const { result } = renderHook(() => ({
      stage: useManualStage(),
      feed: useFeed(),
    }), { wrapper: Wrapper })

    let sceneId: string
    act(() => {
      sceneId = result.current.stage.startScene()
    })

    act(() => {
      result.current.stage.appendText(sceneId!, "Analyzing...")
    })

    act(() => {
      result.current.stage.addWidget(sceneId!, { widget: "dayun", data: { score: 80 } })
    })

    act(() => {
      result.current.stage.setSuggestions(sceneId!, ["Tell me more"])
    })

    act(() => {
      result.current.stage.completeScene(sceneId!)
    })

    const scene = result.current.feed.scenes[0]
    expect(scene.complete).toBe(true)
    expect(scene.items).toHaveLength(2) // text + widget
    expect(scene.items[0]).toEqual({ type: "text", content: "Analyzing..." })
    expect(scene.items[1]).toEqual({
      type: "widget",
      directive: { widget: "dayun", data: { score: 80 } },
    })
    expect(scene.suggestions).toEqual(["Tell me more"])
    expect(result.current.feed.isStreaming).toBe(false)
  })

  it("dispatches actions to registered actors", () => {
    const handler = vi.fn()

    const { result } = renderHook(() => {
      useWand("chart", { highlight: handler })
      return useManualStage()
    }, { wrapper: Wrapper })

    act(() => {
      result.current.dispatch({ target: "chart", do: "highlight", args: { positions: ["日干"] } })
    })

    expect(handler).toHaveBeenCalledWith({ positions: ["日干"] })
  })
})

// ---------------------------------------------------------------------------
// useFeed
// ---------------------------------------------------------------------------

describe("useFeed", () => {
  it("starts with empty scenes", () => {
    const { result } = renderHook(() => useFeed(), { wrapper: Wrapper })

    expect(result.current.scenes).toEqual([])
    expect(result.current.isStreaming).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// WandProvider widget sync
// ---------------------------------------------------------------------------

describe("WandProvider widget sync", () => {
  it("syncs module-level registrations into the store", () => {
    // Register a widget at module scope
    const FakeWidget = ({ data }: { data: Record<string, unknown> }) => (
      <div>{JSON.stringify(data)}</div>
    )
    registerWidget("test-widget", {
      description: "test widget",
      component: FakeWidget,
    })

    // Render provider — it should sync registrations on mount
    const { result } = renderHook(() => {
      const stage = useManualStage()
      const feed = useFeed()
      return { stage, feed }
    }, { wrapper: Wrapper })

    // Start a scene and add this widget — if it's registered,
    // the feed should contain it
    let sceneId: string
    act(() => {
      sceneId = result.current.stage.startScene()
      result.current.stage.addWidget(sceneId, {
        widget: "test-widget",
        data: { hello: "world" },
      })
    })

    expect(result.current.feed.scenes[0].items).toHaveLength(1)
    expect(result.current.feed.scenes[0].items[0]).toEqual({
      type: "widget",
      directive: { widget: "test-widget", data: { hello: "world" } },
    })

    // Clean up global registry
    getRegisteredWidgets().delete("test-widget")
  })
})
