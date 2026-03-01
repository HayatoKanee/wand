/**
 * Box primitive — a container with optional title, border, and children.
 * Primitives are composable: a box can contain other primitives.
 */

import type { CreateDirective } from "@anthropic-ai/wand-core"
import { PrimitiveRenderer } from "./index"

export function BoxPrimitive({ data }: { data: Record<string, unknown> }) {
  const title = data.title ? String(data.title) : undefined
  const border = data.border ? String(data.border) : "#e5e7eb"
  const bg = data.bg ? String(data.bg) : "transparent"
  const children = (data.children ?? []) as CreateDirective[]

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: "0.5rem",
        background: bg,
        padding: "0.75rem",
      }}
    >
      {title && (
        <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.875rem" }}>
          {title}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {children.map((child, i) => (
          <PrimitiveRenderer key={i} directive={child} />
        ))}
      </div>
    </div>
  )
}
