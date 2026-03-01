# Wand — AI-Controlled UI Framework

> AI doesn't just chat. It controls your frontend.

## Vision

Wand is an open-source, provider-agnostic React framework that gives AI three powers over your UI:

1. **Control** — manipulate widgets already on screen (highlight, dim, zoom, connect, annotate)
2. **Spawn** — place registered widgets with data onto the page
3. **Create** — compose new visuals from built-in primitives (arrows, flows, comparisons)

The result: AI becomes a visual narrator, not a chatbot with cards.

---

## Problem

Every AI chat today returns **text** (or at best, pre-built widget cards). The AI cannot:

- Highlight a specific element in an existing chart to explain it
- Draw arrows between two things on screen to show relationships
- Zoom into a section while dimming everything else
- Compose diagrams, flows, and annotations inline with explanation text

Developers who want AI-controlled UI must build the entire orchestration layer from scratch — stage state management, action routing, streaming, cross-component references. This is hundreds of hours of work.

## Solution

Wand provides the orchestration layer. Developers declare what AI can do. AI decides what to show.

```
Developer defines:          AI at runtime:
  "This chart can be         "Highlight year_branch red"
   highlighted, dimmed,      "Dim month and hour"
   zoomed"                   "Draw arrow from 子 to 午"
                             "Show the dayun chart"
  "This widget can be        "Add annotation: 这就是六冲"
   spawned with this
   data shape"

Wand handles everything in between.
```

---

## Core Concepts

### Stage

The page is a **stage**. Everything visible is an **actor** on the stage. Wand tracks what's on stage and tells the AI.

### Scene

Each AI response is a **scene** — a bundle of actions, spawns, creates, and text that Wand renders together.

### Three Powers

#### Power 1: Control (①)

AI manipulates components already on screen.

```typescript
// Developer: one hook
useWand("bazi-chart", {
  highlight: (pos, color) => { ... },
  dim: (positions) => { ... },
  zoom: (pos, scale) => { ... },
  connect: (from, to, label) => { ... },
  reset: () => { ... },
})
```

```json
// AI output (~30 tokens)
{ "target": "bazi-chart", "do": "highlight",
  "args": { "positions": ["year_branch"], "color": "red" } }
```

#### Power 2: Spawn (②)

AI places a registered widget with data.

```typescript
// Developer: register once
registerWidget("dayun-chart", {
  description: "大运走势图",
  schema: z.object({ years: z.array(KLineYearSchema) }),
  component: DayunCard,
})
```

```json
// AI output (~100 tokens)
{ "widget": "dayun-chart", "data": { "years": [...] } }
```

#### Power 3: Create (③)

AI composes visuals from built-in primitives.

```json
// AI output (~50 tokens)
{ "type": "arrow", "from": "子", "to": "午", "label": "子午冲", "color": "red" }
{ "type": "flow", "steps": ["壬水", "→生→", "甲木", "→生→", "丙火"] }
{ "type": "compare", "before": { "火": 38 }, "after": { "火": 28 } }
```

No code generation. No sandboxing. Just data that maps to built-in renderers.

---

## Scene Schema

Every AI response follows this structure:

```typescript
interface WandScene {
  // ① Control existing widgets
  actions?: Array<{
    target: string        // widget ID from useWand()
    do: string            // action name
    args?: Record<string, any>
  }>

  // ② Spawn registered widgets
  spawn?: Array<{
    widget: string        // registered widget name
    data: Record<string, any>
    id?: string           // optional ID for future ① control
  }>

  // ③ Create new visuals from primitives
  create?: Array<{
    type: string          // "arrow" | "flow" | "compare" | "box" | ...
    [key: string]: any    // type-specific props
  }>

  // Text narration (markdown)
  text?: string

  // Suggested next actions (rendered as clickable buttons)
  suggestions?: string[]
}
```

### Token Budget

| Part | Typical Tokens | Description |
|------|---------------|-------------|
| System prompt overhead | ~300 | Stage state + available actions + widget list |
| actions (① Control) | ~10-30 each | Semantic commands, not rendering instructions |
| spawn (② Spawn) | ~50-150 each | Schema-validated data |
| create (③ Create) | ~30-80 each | Primitive type + minimal props |
| text | ~50-200 | Narration |
| **Total per response** | **~150-400** | **Cheaper than current widget JSON dumps** |

---

## Developer API

### Installation

```bash
npm install @wand/react
```

### Setup

```tsx
// app/layout.tsx
import { WandProvider } from "@wand/react"

export default function Layout({ children }) {
  return (
    <WandProvider
      provider="anthropic"       // or "openai", "minimax", custom
      apiKey={process.env.AI_KEY}
      systemPrompt="You are a BaZi analysis assistant..."
    >
      {children}
    </WandProvider>
  )
}
```

### Make Components Controllable

```tsx
// components/bazi-chart.tsx
import { useWand } from "@wand/react"

function BaziChart({ pillars }) {
  const [highlights, setHighlights] = useState({})
  const [dimmed, setDimmed] = useState([])
  const [connections, setConnections] = useState([])

  useWand("bazi-chart", {
    highlight: (positions, color) =>
      setHighlights(h => {
        const next = { ...h }
        positions.forEach(p => next[p] = color)
        return next
      }),
    dim: (positions) => setDimmed(positions),
    connect: (from, to, label, color) =>
      setConnections(c => [...c, { from, to, label, color }]),
    reset: () => {
      setHighlights({})
      setDimmed([])
      setConnections([])
    },
  })

  return (
    <div>
      {pillars.map(p => (
        <PillarColumn
          key={p.name}
          pillar={p}
          highlight={highlights[p.position]}
          dimmed={dimmed.includes(p.position)}
        />
      ))}
      <ConnectionOverlay connections={connections} />
    </div>
  )
}
```

### Register Spawnable Widgets

```tsx
// widgets/index.ts
import { registerWidget } from "@wand/react"

registerWidget("dayun-chart", {
  description: "大运走势图，显示十年运势周期",
  schema: z.object({
    years: z.array(z.object({
      year: z.number(),
      score: z.number(),
      ganZhi: z.string(),
    })),
    currentAge: z.number(),
  }),
  component: DayunCard,
})

registerWidget("spouse-card", {
  description: "配偶性格分析，显示日支藏干推导的配偶特征",
  schema: z.object({
    personality: z.string(),
    appearance: z.string(),
    compatibility: z.number(),
  }),
  component: SpouseCard,
})
```

### Render the Feed

```tsx
// page.tsx
import { WandFeed } from "@wand/react"

// Option A: Feed IS the page
export default function Page() {
  return <WandFeed placeholder="Ask me anything..." />
}

// Option B: Mix with your own layout
export default function Page() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <BaziChart pillars={data.pillars} />  {/* controllable via useWand */}
      <WandFeed className="flex-1" />        {/* AI responses here */}
    </div>
  )
}
```

---

## Built-in Primitives (③ Create)

These ship with `@wand/react`. AI can compose them freely:

| Primitive | Description | Example Use |
|-----------|-------------|-------------|
| `text` | Styled text block (markdown) | Explanations, narration |
| `box` | Container with border, bg, padding | Grouped content |
| `arrow` | Directional arrow with label | Showing relationships (子午冲) |
| `flow` | Step → Step → Step | Showing chains (水→木→火) |
| `badge` | Colored tag/chip | Labels (喜神, 忌神) |
| `bar` | Progress/percentage bar | Element strength (火 38%) |
| `table` | Simple data table | Comparisons |
| `list` | Bulleted/numbered list | Enumerations |
| `divider` | Visual separator | Section breaks |
| `highlight` | Glow/pulse overlay | Emphasizing elements |
| `annotation` | Callout with pointer | Explaining specific things |
| `compare` | Side-by-side before/after | Showing changes |
| `compass` | Directional diagram (N/S/E/W) | Showing 方位 relationships |
| `grid` | Auto-layout grid | Arranging multiple items |

Primitives are **composable** — a `box` can contain `text`, `badge`, and `arrow`:

```json
{
  "type": "box",
  "title": "子午冲",
  "children": [
    { "type": "arrow", "from": "子(水)", "to": "午(火)", "label": "180°对冲" },
    { "type": "text", "content": "水火正面冲突，主变动" },
    { "type": "badge", "label": "凶", "color": "red" }
  ]
}
```

---

## AI Provider Integration

Wand is provider-agnostic. It builds a system prompt with stage context and expects structured JSON output.

### What Wand Sends to AI

```
System prompt:
  You are [developer's system prompt].

  STAGE STATE:
  Currently visible:
  - bazi-chart (actions: highlight, dim, zoom, connect, reset)
  - wuxing-bar (actions: highlight, animate)

  AVAILABLE WIDGETS:
  - dayun-chart: 大运走势图
  - spouse-card: 配偶性格分析

  PRIMITIVES: arrow, flow, compare, box, text, badge, bar, ...

  Respond with a WandScene JSON object.

User message:
  为什么我喜水？
```

### What AI Returns

```json
{
  "actions": [
    { "target": "bazi-chart", "do": "highlight",
      "args": { "positions": ["year_branch", "month_branch", "hour_branch"], "color": "orange" } },
    { "target": "bazi-chart", "do": "dim",
      "args": { "positions": ["day"] } }
  ],
  "create": [
    { "type": "flow",
      "steps": [
        { "label": "午🔥", "color": "#ef4444" },
        { "label": "巳🔥", "color": "#ef4444" },
        { "label": "午🔥", "color": "#ef4444" }
      ],
      "annotation": "三个火 → 火力过旺" },
    { "type": "compare",
      "before": { "label": "现在", "bars": { "火": 38, "水": 10 } },
      "after": { "label": "加水后", "bars": { "火": 28, "水": 20 } } }
  ],
  "text": "火太旺需要水来降温，这就是为什么水是你的喜用神。",
  "suggestions": ["看大运走势", "看今年流年"]
}
```

### Adapters

```typescript
// Built-in adapters handle provider-specific structured output:
import { AnthropicAdapter } from "@wand/adapter-anthropic"
import { OpenAIAdapter } from "@wand/adapter-openai"
import { CustomAdapter } from "@wand/adapter-custom"

// Custom adapter for any provider:
const myAdapter = {
  async *stream(messages, stageContext) {
    // Call your LLM, yield partial WandScene objects
    yield { text: "Thinking..." }
    yield { actions: [...] }
    yield { create: [...] }
  }
}
```

---

## Streaming

Wand streams scenes progressively:

1. `actions` execute immediately (highlights appear as AI "thinks")
2. `create` primitives render as they arrive
3. `text` streams word-by-word (like normal chat)
4. `spawn` widgets render when their data is complete
5. `suggestions` appear at the end

This gives the feeling of AI "presenting" — first it focuses the relevant parts of the screen, then builds the explanation, then offers next steps.

---

## Package Structure

```
@wand/react           Core framework (WandProvider, useWand, WandFeed, primitives)
@wand/adapter-anthropic   Claude adapter
@wand/adapter-openai      OpenAI adapter
@wand/adapter-minimax     MiniMax adapter
@wand/devtools            Inspector + logger
```

---

## Target Users

| User Type | What They Get |
|-----------|---------------|
| **React developers with AI chat** | Drop-in upgrade from text responses to visual narratives |
| **AI-first applications** | Full page control without building orchestration from scratch |
| **Dashboard builders** | AI that can annotate, highlight, and explain existing charts |
| **Education platforms** | AI that draws diagrams and walks through concepts visually |

---

## Competitive Landscape

| Framework | ① Control | ② Spawn | ③ Create | Generic |
|-----------|-----------|---------|----------|---------|
| CopilotKit | No | Yes | No | Yes |
| Tambo | No | Yes | No | Yes |
| AG-UI | Partial | Yes | No | Yes |
| v0/Artifacts | No | No | Yes (full code) | No |
| MCP Apps | No | No | Yes (sandboxed) | No |
| **Wand** | **Yes** | **Yes** | **Yes (constrained)** | **Yes** |

Wand's unique advantage: **① Control**. No other framework lets AI reach into existing components and manipulate them. This is what makes AI feel like a teacher at a whiteboard.

---

## Implementation Phases

### Phase 1: Core (MVP)
- `WandProvider`, `useWand()`, `WandFeed`
- Scene schema + renderer
- 5 core primitives: `text`, `box`, `arrow`, `flow`, `badge`
- Single adapter (Anthropic or OpenAI)
- Basic streaming

### Phase 2: Full Primitives + Multi-Provider
- All 14 primitives
- Adapters for Anthropic, OpenAI, MiniMax
- Custom adapter interface
- `registerWidget()` with Zod schema validation
- DevTools (WandInspector)

### Phase 3: Advanced
- Cross-component connections (arrow from widget A element to widget B element)
- Animation system (sequential action execution with timing)
- History/replay (scroll up, re-expand previous scenes)
- Keyboard shortcuts (navigate between scenes)

### Phase 4: Ecosystem
- Template marketplace (community-shared primitives)
- Framework adapters (Vue, Svelte)
- Server-side rendering support
- Analytics (which primitives/actions are used most)

---

## First Proof of Concept

Rebuild myfate.org chat using Wand:
- BaziChart with `useWand()` for highlight/dim/connect
- WuxingBar with `useWand()` for highlight/animate
- DayunCard, SpouseCard, ShiShenCard as registered widgets
- AI explains 刑冲合害 by controlling the BaziChart + drawing arrows

If this works well for myfate, it works for anything.
