/**
 * Arrow primitive — shows a directional relationship between two things.
 * Used by AI to show connections like 子午冲, 生克 relationships.
 */

export function ArrowPrimitive({ data }: { data: Record<string, unknown> }) {
  const from = String(data.from ?? "")
  const to = String(data.to ?? "")
  const label = data.label ? String(data.label) : undefined
  const color = data.color ? String(data.color) : "#6b7280"
  const style = data.style === "dashed" ? "dashed" : "solid"

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem",
      }}
    >
      <span
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          border: `1px ${style} ${color}`,
          fontWeight: 600,
        }}
      >
        {from}
      </span>
      <svg width="48" height="24" viewBox="0 0 48 24" style={{ flexShrink: 0 }}>
        <line
          x1="0"
          y1="12"
          x2="36"
          y2="12"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={style === "dashed" ? "4,4" : "none"}
        />
        <polygon points="36,6 48,12 36,18" fill={color} />
      </svg>
      <span
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          border: `1px ${style} ${color}`,
          fontWeight: 600,
        }}
      >
        {to}
      </span>
      {label && (
        <span style={{ fontSize: "0.75rem", color: "#6b7280", marginLeft: "0.25rem" }}>
          {label}
        </span>
      )}
    </div>
  )
}
