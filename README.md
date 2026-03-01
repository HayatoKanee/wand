# Wand

**AI doesn't just chat. It controls your frontend.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Wand is an open-source, provider-agnostic React framework that gives AI three powers over your UI:

1. **Control** — manipulate widgets already on screen (highlight, dim, zoom, connect, annotate)
2. **Spawn** — place registered widgets with data onto the page
3. **Create** — compose new visuals from built-in primitives (arrows, flows, comparisons)

The result: AI becomes a visual narrator, not a chatbot with cards.

## Quick Start

```bash
npm install @anthropic-ai/wand-react
```

### 1. Wrap your app with WandProvider

```tsx
import { WandProvider } from "@anthropic-ai/wand-react"

export default function Layout({ children }) {
  return (
    <WandProvider
      provider="anthropic"
      systemPrompt="You are a helpful assistant..."
    >
      {children}
    </WandProvider>
  )
}
```

### 2. Make components controllable

```tsx
import { useWand } from "@anthropic-ai/wand-react"

function MyChart({ data }) {
  const [highlights, setHighlights] = useState({})

  useWand("my-chart", {
    highlight: (positions, color) => setHighlights(/*...*/),
    dim: (positions) => {/* ... */},
    reset: () => setHighlights({}),
  })

  return <Chart data={data} highlights={highlights} />
}
```

### 3. Render the feed

```tsx
import { WandFeed } from "@anthropic-ai/wand-react"

export default function Page() {
  return <WandFeed placeholder="Ask me anything..." />
}
```

The AI can now highlight, dim, and annotate your chart while explaining things to the user — no extra code needed.

## Packages

| Package | Description |
|---------|-------------|
| [`@anthropic-ai/wand-core`](packages/core) | Domain types, ports, and orchestration |
| [`@anthropic-ai/wand-react`](packages/react) | React hooks, components, and primitives |
| [`@anthropic-ai/wand-adapter-anthropic`](packages/adapter-anthropic) | Adapter for Anthropic Claude |
| [`@anthropic-ai/wand-adapter-openai`](packages/adapter-openai) | Adapter for OpenAI |
| [`@anthropic-ai/wand-devtools`](packages/devtools) | Inspector, logger, and scene replay |

## Built-in Primitives

AI can compose these to create inline visuals — no code generation or sandboxing required:

| Primitive | Description |
|-----------|-------------|
| `arrow` | Directional arrow with label |
| `flow` | Step-by-step chain |
| `compare` | Side-by-side before/after |
| `box` | Container with border and background |
| `badge` | Colored tag or chip |
| `bar` | Progress/percentage bar |
| `table` | Simple data table |
| `text` | Styled text block (markdown) |
| `list` | Bulleted/numbered list |
| `divider` | Visual separator |
| `highlight` | Glow/pulse overlay |
| `annotation` | Callout with pointer |
| `compare` | Side-by-side comparison |
| `grid` | Auto-layout grid |

## Streaming

Wand streams AI responses progressively:

1. **Actions** execute immediately (highlights appear as AI "thinks")
2. **Primitives** render as they arrive
3. **Text** streams word-by-word
4. **Widgets** render when their data is complete
5. **Suggestions** appear at the end

This gives the feeling of AI "presenting" — first it focuses the relevant parts of the screen, then builds the explanation, then offers next steps.

## Architecture

See [DESIGN.md](DESIGN.md) for the full architecture document, including the scene schema, provider integration, and implementation phases.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, project structure, and PR guidelines.

## License

[MIT](LICENSE)
