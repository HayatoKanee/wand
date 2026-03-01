/**
 * Badge primitive — a colored tag/chip.
 * Used by AI for labels like 喜神, 忌神.
 */

export function BadgePrimitive({ data }: { data: Record<string, unknown> }) {
  const label = String(data.label ?? "")
  const color = data.color ? String(data.color) : "#6b7280"
  const variant = data.variant === "outline" ? "outline" : "filled"

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.125rem 0.5rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500,
        ...(variant === "filled"
          ? { background: `${color}20`, color, border: `1px solid ${color}` }
          : { background: "transparent", color, border: `1px solid ${color}` }),
      }}
    >
      {label}
    </span>
  )
}
