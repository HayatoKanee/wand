/**
 * MockAdapter — a fake AI adapter for demo purposes.
 *
 * Responds to any message with a canned scene that demonstrates
 * all three Wand powers: Control, Spawn, and Create.
 * No API key required.
 */

import type { AIPort, AIMessage, StageContext, Scene } from "@anthropic-ai/wand-core"

const RESPONSES: Record<string, Partial<Scene>> = {
  default: {
    text: "Welcome to Wand! I can control UI, spawn widgets, and create visuals.\n\nTry asking me to:\n- \"show a flow\"\n- \"compare things\"\n- \"highlight something\"",
    suggestions: ["Show a flow", "Compare things", "Highlight something"],
  },
  flow: {
    create: [
      {
        type: "flow",
        steps: [
          { label: "Input", color: "#3b82f6" },
          { label: "Process", color: "#8b5cf6" },
          { label: "Output", color: "#10b981" },
        ],
        annotation: "A simple data pipeline",
      },
    ],
    text: "Here's a flow diagram showing a basic data pipeline. Each step connects to the next.",
    suggestions: ["Add a comparison", "Show a table"],
  },
  compare: {
    create: [
      {
        type: "compare",
        before: { label: "Before", bars: { Performance: 45, Reliability: 60 } },
        after: { label: "After", bars: { Performance: 85, Reliability: 92 } },
      },
    ],
    text: "Here's a before/after comparison showing improvements in performance and reliability.",
    suggestions: ["Show a flow", "Highlight something"],
  },
  highlight: {
    create: [
      { type: "highlight", target: "Important Item", color: "#ef4444", effect: "glow" },
      { type: "annotation", target: "Key Concept", content: "This is worth noting!", position: "right" },
      {
        type: "box",
        title: "Summary",
        children: [
          { type: "badge", label: "Active", color: "#10b981" },
          { type: "badge", label: "Priority", color: "#ef4444" },
          { type: "bar", label: "Progress", value: 73, max: 100, color: "#3b82f6" },
        ],
      },
    ],
    text: "Here are some visual highlights: a glowing emphasis, an annotation callout, and a summary box with badges and a progress bar.",
    suggestions: ["Show a flow", "Compare things"],
  },
}

function matchResponse(message: string): Partial<Scene> {
  const lower = message.toLowerCase()
  if (lower.includes("flow") || lower.includes("pipeline") || lower.includes("step")) {
    return RESPONSES.flow
  }
  if (lower.includes("compare") || lower.includes("before") || lower.includes("after")) {
    return RESPONSES.compare
  }
  if (lower.includes("highlight") || lower.includes("badge") || lower.includes("box")) {
    return RESPONSES.highlight
  }
  return RESPONSES.default
}

export class MockAdapter implements AIPort {
  async *stream(
    messages: readonly AIMessage[],
    _context: StageContext,
  ): AsyncIterable<Partial<Scene>> {
    const lastMessage = messages[messages.length - 1]
    const response = matchResponse(lastMessage?.content ?? "")

    // Simulate streaming: yield text progressively, then the rest
    if (response.text) {
      const words = response.text.split(" ")
      for (let i = 1; i <= words.length; i++) {
        yield { text: words.slice(0, i).join(" ") }
        // Small delay to simulate streaming
        await new Promise((r) => setTimeout(r, 30))
      }
    }

    // Yield the full response with create/actions/spawn
    yield response
  }
}
