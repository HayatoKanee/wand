/**
 * Annotation primitive — a callout pointing to a target with explanatory content.
 * Used by AI to explain specific things on screen.
 */

export function AnnotationPrimitive({ data }: { data: Record<string, unknown> }) {
  const target = String(data.target ?? "")
  const content = String(data.content ?? "")
  const position = (data.position as string) ?? "top"

  const isVertical = position === "top" || position === "bottom"

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        gap: "0.25rem",
      }}
    >
      {(position === "top" || position === "left") && (
        <div
          style={{
            padding: "0.375rem 0.625rem",
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: "0.375rem",
            fontSize: "0.75rem",
            color: "#92400e",
            maxWidth: "16rem",
          }}
        >
          {content}
        </div>
      )}
      <div
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          border: "1px solid #fbbf24",
          fontWeight: 600,
          fontSize: "0.875rem",
        }}
      >
        {target}
      </div>
      {(position === "bottom" || position === "right") && (
        <div
          style={{
            padding: "0.375rem 0.625rem",
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: "0.375rem",
            fontSize: "0.75rem",
            color: "#92400e",
            maxWidth: "16rem",
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
