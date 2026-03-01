/**
 * Compass primitive — a directional diagram showing N/S/E/W relationships.
 * Used by AI to display directional or positional relationships.
 */

export function CompassPrimitive({ data }: { data: Record<string, unknown> }) {
  const directions = (data.directions ?? {}) as Record<string, string>
  const center = data.center ? String(data.center) : undefined

  const cellStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.25rem",
    fontSize: "0.75rem",
    minWidth: "3rem",
    minHeight: "2rem",
  }

  const labelStyle: React.CSSProperties = {
    padding: "0.125rem 0.375rem",
    borderRadius: "0.25rem",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    fontWeight: 500,
  }

  return (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr 1fr",
        gap: "0.125rem",
        padding: "0.5rem",
      }}
    >
      {/* Row 1: NW, N, NE */}
      <div style={cellStyle}>
        {directions.NW && <span style={labelStyle}>{directions.NW}</span>}
      </div>
      <div style={cellStyle}>
        {directions.N && <span style={labelStyle}>{directions.N}</span>}
      </div>
      <div style={cellStyle}>
        {directions.NE && <span style={labelStyle}>{directions.NE}</span>}
      </div>

      {/* Row 2: W, Center, E */}
      <div style={cellStyle}>
        {directions.W && <span style={labelStyle}>{directions.W}</span>}
      </div>
      <div style={cellStyle}>
        {center && (
          <span style={{ ...labelStyle, background: "#dbeafe", border: "1px solid #93c5fd", fontWeight: 600 }}>
            {center}
          </span>
        )}
      </div>
      <div style={cellStyle}>
        {directions.E && <span style={labelStyle}>{directions.E}</span>}
      </div>

      {/* Row 3: SW, S, SE */}
      <div style={cellStyle}>
        {directions.SW && <span style={labelStyle}>{directions.SW}</span>}
      </div>
      <div style={cellStyle}>
        {directions.S && <span style={labelStyle}>{directions.S}</span>}
      </div>
      <div style={cellStyle}>
        {directions.SE && <span style={labelStyle}>{directions.SE}</span>}
      </div>
    </div>
  )
}
