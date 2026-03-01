/**
 * WandFeed — the scrollable feed that renders AI scenes.
 *
 * Each scene from the AI becomes a visual block in the feed containing:
 * - Text narration (markdown-rendered)
 * - Created primitives (arrows, flows, comparisons, etc.)
 * - Spawned widgets (registered components with data)
 * - Suggestion buttons at the end
 *
 * @example
 * ```tsx
 * <WandFeed
 *   placeholder="Ask me anything..."
 *   onSuggestionClick={(suggestion) => send(suggestion)}
 * />
 * ```
 */

import type { ReactNode } from "react"
import { useStore } from "zustand"
import { useFeed } from "../hooks/use-feed"
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
  className,
  onSuggestionClick,
  renderText,
}: WandFeedProps) {
  const { scenes, isStreaming } = useFeed()

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {scenes.map((scene) => (
        <SceneBlock
          key={scene.id}
          scene={scene}
          onSuggestionClick={onSuggestionClick}
          renderText={renderText}
        />
      ))}
      {isStreaming && (
        <div style={{ opacity: 0.5 }}>Thinking...</div>
      )}
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
