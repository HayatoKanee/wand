import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { WandProvider, WandFeed } from "@anthropic-ai/wand-react"
import { MockAdapter } from "./mock-adapter"

const adapter = new MockAdapter()

function App() {
  return (
    <WandProvider adapter={adapter} systemPrompt="You are a helpful demo assistant.">
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        maxWidth: "48rem",
        margin: "0 auto",
      }}>
        <header style={{
          padding: "1rem",
          borderBottom: "1px solid #e5e7eb",
          textAlign: "center",
        }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Wand Demo
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
            AI-controlled UI with Control, Spawn, and Create
          </p>
        </header>
        <WandFeed
          placeholder="Try: show a flow, compare things, highlight something..."
        />
      </div>
    </WandProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
