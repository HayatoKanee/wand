/**
 * WandFeed — the scrollable feed that renders AI scenes with a built-in chat input.
 *
 * Each scene from the AI becomes a visual block in the feed containing:
 * - Text narration (markdown-rendered)
 * - Created primitives (arrows, flows, comparisons, etc.)
 * - Spawned widgets (registered components with data)
 * - Suggestion buttons at the end
 *
 * When used inside a WandProvider, the feed automatically connects to the AI
 * adapter and renders a text input for sending messages.
 *
 * @example
 * ```tsx
 * <WandFeed placeholder="Ask me anything..." />
 * ```
 */

import type { ReactNode } from "react"
import { useRef, useEffect } from "react"
import { useStore } from "zustand"
import { useFeed } from "../hooks/use-feed"
import { useWandChat } from "../hooks/use-wand-chat"
import { useWandStore } from "../context"
import type { FeedItem, SceneEntry } from "../store"
import { PrimitiveRenderer } from "./primitives/index"

export interface WandFeedProps {
  placeholder?: string
  className?: string
  onSuggestionClick?: (suggestion: string) => void
  renderText?: (content: string) => ReactNode
}

export function WandFeed({
  placeholder = "Type a message...",
  className,
  onSuggestionClick,
  renderText,
}: WandFeedProps) {
  const { scenes, isStreaming } = useFeed()
  const { input, setInput, handleSubmit, send, stop } = useWandChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [scenes, isStreaming])

  const handleSuggestion = (suggestion: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion)
    } else {
      send(suggestion)
    }
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Scene feed */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1rem",
        }}
      >
        {scenes.map((scene) => (
          <SceneBlock
            key={scene.id}
            scene={scene}
            onSuggestionClick={handleSuggestion}
            renderText={renderText}
          />
        ))}
        {isStreaming && scenes.length === 0 && (
          <div style={{ opacity: 0.5 }}>Thinking...</div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid #d1d5db",
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={stop}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              background: "#fee2e2",
              color: "#991b1b",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: input.trim() ? "#2563eb" : "#93c5fd",
              color: "white",
              cursor: input.trim() ? "pointer" : "default",
              fontSize: "0.875rem",
            }}
          >
            Send
          </button>
        )}
      </form>
    </div>
  )
}

function SceneBlock({
  scene,
  onSuggestionClick,
  renderText,
}: {
  scene: SceneEntry
  onSuggestionClick?: (s: string) => void
  renderText?: (content: string) => ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {scene.items.map((item, i) => (
        <FeedItemRenderer key={i} item={item} renderText={renderText} />
      ))}
      {scene.suggestions.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {scene.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestionClick?.(s)}
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "1rem",
                border: "1px solid #e5e7eb",
                background: "white",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FeedItemRenderer({
  item,
  renderText,
}: {
  item: FeedItem
  renderText?: (content: string) => ReactNode
}) {
  switch (item.type) {
    case "text":
      return renderText ? (
        <>{renderText(item.content)}</>
      ) : (
        <div style={{ whiteSpace: "pre-wrap" }}>{item.content}</div>
      )
    case "primitive":
      return <PrimitiveRenderer directive={item.directive} />
    case "widget":
      // Widget rendering is handled by the consumer through registration
      return (
        <div data-wand-widget={item.directive.widget}>
          {/* The actual widget component is resolved at render time */}
          <WidgetRenderer directive={item.directive} />
        </div>
      )
    default:
      return null
  }
}

function WidgetRenderer({ directive }: { directive: { widget: string; data: Record<string, unknown> } }) {
  const store = useWandStore()
  const widget = useStore(store, (s) => s.widgets.get(directive.widget))

  if (!widget) {
    return (
      <div
        style={{
          padding: "1rem",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          background: "#f9fafb",
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          Unknown widget: {directive.widget}
        </div>
      </div>
    )
  }

  const Component = widget.component
  return <Component data={directive.data} />
}
