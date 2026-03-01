/**
 * Table primitive — a simple data table.
 */

export function TablePrimitive({ data }: { data: Record<string, unknown> }) {
  const headers = (data.headers ?? []) as string[]
  const rows = (data.rows ?? []) as string[][]

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.875rem",
      }}
    >
      {headers.length > 0 && (
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "0.375rem 0.5rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td
                key={j}
                style={{
                  padding: "0.375rem 0.5rem",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
