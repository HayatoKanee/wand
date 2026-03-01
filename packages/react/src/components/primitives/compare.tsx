/**
 * Compare primitive — side-by-side before/after comparison.
 * Used by AI to show changes like element strength adjustments.
 */

export function ComparePrimitive({ data }: { data: Record<string, unknown> }) {
  const before = data.before as { label?: string; bars?: Record<string, number>; items?: string[] } | undefined
  const after = data.after as { label?: string; bars?: Record<string, number>; items?: string[] } | undefined

  if (!before || !after) return null

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
        padding: "0.5rem",
      }}
    >
      <ComparePanel label={before.label ?? "Before"} bars={before.bars} items={before.items} />
      <ComparePanel label={after.label ?? "After"} bars={after.bars} items={after.items} />
    </div>
  )
}

function ComparePanel({
  label,
  bars,
  items,
}: {
  label: string
  bars?: Record<string, number>
  items?: string[]
}) {
  return (
    <div
      style={{
        padding: "0.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
      }}
    >
      <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
        {label}
      </div>
      {bars &&
        Object.entries(bars).map(([key, value]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", minWidth: "1.5rem" }}>{key}</span>
            <div style={{ flex: 1, height: "0.375rem", background: "#f3f4f6", borderRadius: "0.25rem" }}>
              <div
                style={{
                  width: `${Math.min(100, value)}%`,
                  height: "100%",
                  background: "#3b82f6",
                  borderRadius: "0.25rem",
                }}
              />
            </div>
            <span style={{ fontSize: "0.625rem", color: "#6b7280" }}>{value}</span>
          </div>
        ))}
      {items?.map((item, i) => (
        <div key={i} style={{ fontSize: "0.75rem", padding: "0.125rem 0" }}>
          {item}
        </div>
      ))}
    </div>
  )
}
