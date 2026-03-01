/**
 * Grid primitive — auto-layout grid for arranging child primitives.
 * Used by AI to lay out multiple items in a responsive grid.
 */

import type { CreateDirective } from "@anthropic-ai/wand-core"
import { PrimitiveRenderer } from "./index"

export function GridPrimitive({ data }: { data: Record<string, unknown> }) {
  const columns = Number(data.columns ?? 2)
  const children = (data.children ?? []) as CreateDirective[]

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "0.5rem",
        padding: "0.25rem",
      }}
    >
      {children.map((child, i) => (
        <div key={i}>
          <PrimitiveRenderer directive={child} />
        </div>
      ))}
    </div>
  )
}
