/**
 * Bar primitive — a progress/percentage bar.
 * Used by AI to show element strength like 火 38%.
 */

export function BarPrimitive({ data }: { data: Record<string, unknown> }) {
  const label = String(data.label ?? "")
  const value = Number(data.value ?? 0)
  const max = Number(data.max ?? 100)
  const color = data.color ? String(data.color) : "#3b82f6"
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0" }}>
      <span style={{ fontSize: "0.875rem", fontWeight: 500, minWidth: "2rem" }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: "0.5rem",
          background: "#f3f4f6",
          borderRadius: "0.25rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "0.25rem",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "0.75rem", color: "#6b7280", minWidth: "2rem", textAlign: "right" }}>
        {value}
      </span>
    </div>
  )
}
