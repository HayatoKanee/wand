/**
 * Flow primitive — shows a step-by-step progression.
 * Used by AI to show chains like 水→木→火.
 */

export function FlowPrimitive({ data }: { data: Record<string, unknown> }) {
  const steps = (data.steps ?? []) as Array<{ label: string; color?: string }>
  const annotation = data.annotation ? String(data.annotation) : undefined

  return (
    <div style={{ padding: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
        {steps.map((step, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                background: step.color ? `${step.color}20` : "#f3f4f6",
                color: step.color ?? "#374151",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: `1px solid ${step.color ?? "#d1d5db"}`,
              }}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span style={{ color: "#9ca3af", fontSize: "1.25rem" }}>→</span>
            )}
          </span>
        ))}
      </div>
      {annotation && (
        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
          {annotation}
        </div>
      )}
    </div>
  )
}
