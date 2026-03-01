/**
 * WandInspector — a debug panel showing current stage state.
 *
 * Displays registered actors, their actions, and recent scene events.
 * Mount this during development to see what Wand is doing.
 *
 * @example
 * ```tsx
 * {process.env.NODE_ENV === "development" && <WandInspector />}
 * ```
 */

export interface WandInspectorProps {
  position?: "bottom-right" | "bottom-left"
}

export function WandInspector({ position = "bottom-right" }: WandInspectorProps) {
  // Placeholder — Phase 2 implementation will:
  // 1. Subscribe to the WandStore
  // 2. Show registered actors and their actions
  // 3. Log dispatched actions in real-time
  // 4. Show scene history with replay capability
  return (
    <div
      style={{
        position: "fixed",
        [position === "bottom-right" ? "right" : "left"]: "1rem",
        bottom: "1rem",
        background: "#1f2937",
        color: "#e5e7eb",
        padding: "0.75rem",
        borderRadius: "0.5rem",
        fontSize: "0.75rem",
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: "20rem",
        maxHeight: "15rem",
        overflow: "auto",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Wand DevTools</div>
      <div style={{ color: "#9ca3af" }}>Inspector coming in Phase 2</div>
    </div>
  )
}
