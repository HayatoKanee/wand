/**
 * Highlight primitive — a glow/pulse overlay to emphasize elements.
 * Used by AI to draw attention to a specific target.
 */

export function HighlightPrimitive({ data }: { data: Record<string, unknown> }) {
  const target = String(data.target ?? "")
  const color = data.color ? String(data.color) : "#f59e0b"
  const effect = data.effect === "pulse" ? "pulse" : data.effect === "border" ? "border" : "glow"

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.25rem 0.75rem",
    borderRadius: "0.375rem",
    fontWeight: 600,
    fontSize: "0.875rem",
  }

  const effectStyles: Record<string, React.CSSProperties> = {
    glow: {
      background: `${color}20`,
      color,
      boxShadow: `0 0 8px ${color}40`,
    },
    pulse: {
      background: `${color}15`,
      color,
      border: `2px solid ${color}`,
      animation: "wand-pulse 1.5s ease-in-out infinite",
    },
    border: {
      background: "transparent",
      color,
      border: `2px solid ${color}`,
    },
  }

  return (
    <span style={{ ...baseStyle, ...effectStyles[effect] }}>
      {target}
    </span>
  )
}
