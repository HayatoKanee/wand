/**
 * PrimitiveRenderer — renders a CreateDirective using built-in visual components.
 *
 * Maps the `type` field to a React component. Unknown types render a debug fallback.
 */

import type { CreateDirective } from "@anthropic-ai/wand-core"
import { ArrowPrimitive } from "./arrow"
import { FlowPrimitive } from "./flow"
import { BadgePrimitive } from "./badge"
import { BarPrimitive } from "./bar"
import { ComparePrimitive } from "./compare"
import { TablePrimitive } from "./table"
import { BoxPrimitive } from "./box"

const RENDERERS: Record<string, React.ComponentType<{ data: Record<string, unknown> }>> = {
  arrow: ArrowPrimitive,
  flow: FlowPrimitive,
  badge: BadgePrimitive,
  bar: BarPrimitive,
  compare: ComparePrimitive,
  table: TablePrimitive,
  box: BoxPrimitive,
}

export function PrimitiveRenderer({ directive }: { directive: CreateDirective }) {
  const Renderer = RENDERERS[directive.type]

  if (Renderer) {
    return <Renderer data={directive as unknown as Record<string, unknown>} />
  }

  // Text primitive — just render content directly
  if (directive.type === "text") {
    const content = (directive as Record<string, unknown>).content
    return <div style={{ whiteSpace: "pre-wrap" }}>{String(content ?? "")}</div>
  }

  // Divider
  if (directive.type === "divider") {
    return <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "0.5rem 0" }} />
  }

  // List
  if (directive.type === "list") {
    const items = ((directive as Record<string, unknown>).items ?? []) as string[]
    const ordered = (directive as Record<string, unknown>).ordered === true
    const Tag = ordered ? "ol" : "ul"
    return (
      <Tag style={{ margin: 0, paddingLeft: "1.5rem" }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </Tag>
    )
  }

  // Unknown type — debug fallback
  return (
    <div
      style={{
        padding: "0.5rem",
        border: "1px dashed #d1d5db",
        borderRadius: "0.25rem",
        fontSize: "0.75rem",
        color: "#6b7280",
      }}
    >
      Unknown primitive: {directive.type}
    </div>
  )
}
